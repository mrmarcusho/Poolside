import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
            isOnline: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
            isOnline: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        const participant = conv.user1Id === userId ? conv.user2 : conv.user1;
        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          participant,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                sentAt: lastMessage.createdAt,
                isFromMe: lastMessage.senderId === userId,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return { conversations: conversationsWithUnread };
  }

  async getMessages(conversationId: string, userId: string, limit = 50, before?: string) {
    // Check if user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(before && { createdAt: { lt: new Date(before) } }),
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
        senderId: m.senderId,
        sentAt: m.createdAt,
        readAt: m.readAt,
      })),
      hasMore,
    };
  }

  async sendMessage(conversationId: string, userId: string, text: string) {
    // Check if user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          text,
          senderId: userId,
          conversationId,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      sentAt: message.createdAt,
      readAt: null,
    };
  }

  async createConversation(userId: string, toUserId: string, message?: string) {
    // Check if conversation already exists
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: userId },
        ],
      },
    });

    if (existingConversation) {
      // If message provided, send it; otherwise just return conversation info
      if (message && message.trim()) {
        const sentMessage = await this.sendMessage(existingConversation.id, userId, message);
        return {
          conversationId: existingConversation.id,
          message: sentMessage,
        };
      }
      return {
        conversationId: existingConversation.id,
        message: null,
      };
    }

    // Create new conversation (with optional first message)
    const conversationData: any = {
      user1Id: userId,
      user2Id: toUserId,
    };

    if (message && message.trim()) {
      conversationData.messages = {
        create: {
          text: message,
          senderId: userId,
        },
      };
    }

    const conversation = await this.prisma.conversation.create({
      data: conversationData,
      include: {
        messages: true,
      },
    });

    return {
      conversationId: conversation.id,
      message: conversation.messages[0]
        ? {
            id: conversation.messages[0].id,
            text: conversation.messages[0].text,
            senderId: userId,
            sentAt: conversation.messages[0].createdAt,
            readAt: null,
          }
        : null,
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    // Check if user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    // Mark all unread messages from other user as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }
}
