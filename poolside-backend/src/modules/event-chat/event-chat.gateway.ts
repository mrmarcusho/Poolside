import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { EventChatService } from './event-chat.service';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface JwtPayload {
  sub: string;
  email: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class EventChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventChatGateway');

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private eventChatService: EventChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException('JWT secret not configured');
      }
      const payload = verify(token as string, secret) as JwtPayload;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      (client as AuthenticatedSocket).user = user;

      this.logger.log(`Client connected: ${user.name} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(`Client disconnected: ${client.user.name} (${client.id})`);
    }
  }

  /**
   * Check if user can access event chat (is host OR has RSVP "GOING")
   */
  private async canAccessEventChat(eventId: string, userId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });

    if (!event) {
      return false;
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

  @SubscribeMessage('join_event_chat')
  async handleJoinEventChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data;
    this.logger.log(`[join_event_chat] Received from client ${client.id}, eventId: ${eventId}`);

    if (!client.user) {
      this.logger.warn(`[join_event_chat] Client ${client.id} not authenticated`);
      return { error: 'Not authenticated' };
    }

    this.logger.log(`[join_event_chat] User ${client.user.name} (${client.user.id}) requesting to join event ${eventId}`);

    // Verify user can access this event chat
    const canAccess = await this.canAccessEventChat(eventId, client.user.id);
    if (!canAccess) {
      this.logger.warn(`[join_event_chat] User ${client.user.name} cannot access event ${eventId}`);
      return { error: 'You must be going to this event to join the chat' };
    }

    client.join(`event:${eventId}`);
    this.logger.log(`[join_event_chat] ${client.user.name} successfully joined event chat ${eventId}`);

    return { success: true };
  }

  @SubscribeMessage('leave_event_chat')
  handleLeaveEventChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data;
    client.leave(`event:${eventId}`);

    if (client.user) {
      this.logger.log(`${client.user.name} left event chat ${eventId}`);
    }

    return { success: true };
  }

  @SubscribeMessage('send_event_message')
  async handleSendEventMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string; text: string; replyToId?: string; imageUrl?: string },
  ) {
    const { eventId, text, replyToId, imageUrl } = data;
    this.logger.log(`[send_event_message] Received from client ${client.id}, eventId: ${eventId}, text: "${text?.substring(0, 50)}...", replyToId: ${replyToId || 'none'}, hasImage: ${!!imageUrl}`);

    if (!client.user) {
      this.logger.warn(`[send_event_message] Client ${client.id} not authenticated`);
      return { error: 'Not authenticated' };
    }

    this.logger.log(`[send_event_message] User ${client.user.name} sending message to event ${eventId}`);

    try {
      const message = await this.eventChatService.sendEventMessage(
        eventId,
        client.user.id,
        text,
        replyToId,
        imageUrl,
      );
      this.logger.log(`[send_event_message] Message saved with id: ${message.id}`);

      // Broadcast to all in the event room (including sender)
      const roomName = `event:${eventId}`;
      const socketsInRoom = await this.server.in(roomName).fetchSockets();
      this.logger.log(`[send_event_message] Broadcasting to room ${roomName}, ${socketsInRoom.length} clients in room`);

      this.server.to(roomName).emit('new_event_message', {
        eventId,
        message,
      });
      this.logger.log(`[send_event_message] Broadcast complete`);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`[send_event_message] Error: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('get_message_replies')
  async handleGetMessageReplies(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const { messageId } = data;
    this.logger.log(`[get_message_replies] Received request for messageId: ${messageId}`);

    if (!client.user) {
      this.logger.warn(`[get_message_replies] Client not authenticated`);
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const result = await this.eventChatService.getMessageReplies(messageId, client.user.id);
      this.logger.log(`[get_message_replies] Success - found ${result.replies.length} replies`);
      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`[get_message_replies] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('event_typing_start')
  handleEventTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data;

    if (!client.user) {
      return { error: 'Not authenticated' };
    }

    // Broadcast to others in the room (exclude sender)
    client.to(`event:${eventId}`).emit('event_user_typing', {
      eventId,
      userId: client.user.id,
      userName: client.user.name,
    });

    return { success: true };
  }

  @SubscribeMessage('event_typing_stop')
  handleEventTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data;

    if (!client.user) {
      return { error: 'Not authenticated' };
    }

    // Broadcast to others in the room (exclude sender)
    client.to(`event:${eventId}`).emit('event_user_stopped_typing', {
      eventId,
      userId: client.user.id,
    });

    return { success: true };
  }

  /**
   * Broadcast RSVP update to all connected clients
   * Called from RsvpController when RSVP counts change
   */
  broadcastRsvpUpdate(data: {
    eventId: string;
    rsvpCount: { going: number; interested: number };
    isFull: boolean;
    spots: number | null;
    userId: string; // The user who triggered the RSVP change
  }) {
    this.logger.log(`[broadcastRsvpUpdate] Broadcasting RSVP update for event ${data.eventId}: going=${data.rsvpCount.going}, isFull=${data.isFull}, userId=${data.userId}`);

    // Broadcast to ALL connected clients so everyone's feed updates
    this.server.emit('event_rsvp_updated', data);
  }
}
