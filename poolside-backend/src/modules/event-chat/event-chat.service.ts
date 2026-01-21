import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can access event chat (is host OR has RSVP "GOING")
   */
  private async canAccessEventChat(eventId: string, userId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Host always has access
    if (event.hostId === userId) {
      return true;
    }

    // Check if user has RSVP "GOING"
    const rsvp = await this.prisma.rsvp.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    return rsvp?.status === 'GOING';
  }

  /**
   * Get all event chats for a user (events where they are host OR going, with messages)
   */
  async getEventChats(userId: string) {
    // Find events where user is host or has RSVP "GOING" AND has at least 1 message
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { hostId: userId },
          {
            rsvps: {
              some: {
                userId,
                status: 'GOING',
              },
            },
          },
        ],
        eventMessages: {
          some: {}, // Has at least one message
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        eventMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            eventMessages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get all lastReadAt timestamps for this user's event chats
    const eventIds = events.map(e => e.id);
    const readRecords = await this.prisma.eventChatRead.findMany({
      where: {
        userId,
        eventId: { in: eventIds },
      },
    });
    const readMap = new Map(readRecords.map(r => [r.eventId, r.lastReadAt]));

    // Calculate unread counts for each event
    const unreadCounts = await Promise.all(
      events.map(async (event) => {
        const lastReadAt = readMap.get(event.id);
        if (!lastReadAt) {
          // Never read - all messages (except user's own) are unread
          return this.prisma.eventMessage.count({
            where: {
              eventId: event.id,
              senderId: { not: userId },
            },
          });
        }
        // Count messages after lastReadAt (excluding user's own)
        return this.prisma.eventMessage.count({
          where: {
            eventId: event.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        });
      })
    );

    return {
      eventChats: events.map((event, index) => {
        const lastMessage = event.eventMessages[0];
        return {
          id: event.id,
          title: event.title,
          eventImage: event.eventImage,
          dateTime: event.dateTime,
          host: event.host,
          isHost: event.hostId === userId,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                senderName: lastMessage.sender.name,
                sentAt: lastMessage.createdAt,
                isFromMe: lastMessage.senderId === userId,
              }
            : null,
          messageCount: event._count.eventMessages,
          unreadCount: unreadCounts[index],
        };
      }),
    };
  }

  /**
   * Mark event chat as read (update lastReadAt timestamp)
   */
  async markEventChatAsRead(eventId: string, userId: string) {
    await this.prisma.eventChatRead.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        userId,
        eventId,
        lastReadAt: new Date(),
      },
    });
    return { success: true };
  }

  /**
   * Get messages for an event chat
   */
  async getEventMessages(eventId: string, userId: string, limit = 50, before?: string) {
    // Check access
    const canAccess = await this.canAccessEventChat(eventId, userId);
    if (!canAccess) {
      throw new ForbiddenException('You must be going to this event to view the chat');
    }

    const messages = await this.prisma.eventMessage.findMany({
      where: {
        eventId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, -1) : messages;

    return {
      messages: results.reverse().map((m) => ({
        id: m.id,
        text: m.text,
        imageUrl: m.imageUrl,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderEmoji: m.sender.emoji,
        senderAvatar: m.sender.avatar,
        sentAt: m.createdAt,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              text: m.replyTo.text,
              senderName: m.replyTo.sender.name,
              senderId: m.replyTo.senderId,
            }
          : null,
        replyCount: m._count.replies,
      })),
      hasMore,
    };
  }

  /**
   * Send a message to an event chat
   */
  async sendEventMessage(eventId: string, userId: string, text: string, replyToId?: string, imageUrl?: string) {
    // Check access
    const canAccess = await this.canAccessEventChat(eventId, userId);
    if (!canAccess) {
      throw new ForbiddenException('You must be going to this event to send messages');
    }

    const message = await this.prisma.eventMessage.create({
      data: {
        eventId,
        senderId: userId,
        text,
        ...(replyToId && { replyToId }),
        ...(imageUrl && { imageUrl }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update event's updatedAt to sort chats by recent activity
    await this.prisma.event.update({
      where: { id: eventId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      text: message.text,
      imageUrl: message.imageUrl,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderEmoji: message.sender.emoji,
      senderAvatar: message.sender.avatar,
      sentAt: message.createdAt,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            text: message.replyTo.text,
            senderName: message.replyTo.sender.name,
            senderId: message.replyTo.senderId,
          }
        : null,
      replyCount: 0,
    };
  }

  /**
   * Get replies to a specific message (for thread view)
   */
  async getMessageReplies(messageId: string, userId: string) {
    const message = await this.prisma.eventMessage.findUnique({
      where: { id: messageId },
      select: { eventId: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check access
    const canAccess = await this.canAccessEventChat(message.eventId, userId);
    if (!canAccess) {
      throw new ForbiddenException('You must be going to this event to view replies');
    }

    // Get the original message with its replies
    const originalMessage = await this.prisma.eventMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                emoji: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!originalMessage) {
      throw new NotFoundException('Message not found');
    }

    return {
      originalMessage: {
        id: originalMessage.id,
        text: originalMessage.text,
        senderId: originalMessage.senderId,
        senderName: originalMessage.sender.name,
        senderEmoji: originalMessage.sender.emoji,
        senderAvatar: originalMessage.sender.avatar,
        sentAt: originalMessage.createdAt,
      },
      replies: originalMessage.replies.map((r) => ({
        id: r.id,
        text: r.text,
        senderId: r.senderId,
        senderName: r.sender.name,
        senderEmoji: r.sender.emoji,
        senderAvatar: r.sender.avatar,
        sentAt: r.createdAt,
      })),
    };
  }

  /**
   * Get event info for chat header
   */
  async getEventChatInfo(eventId: string, userId: string) {
    const canAccess = await this.canAccessEventChat(eventId, userId);
    if (!canAccess) {
      throw new ForbiddenException('You must be going to this event to view the chat');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'GOING' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      id: event.id,
      title: event.title,
      eventImage: event.eventImage,
      dateTime: event.dateTime,
      host: event.host,
      goingCount: event._count.rsvps,
      isHost: event.hostId === userId,
    };
  }
}
