import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from './messages.service';

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
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('MessagesGateway');

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
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

      // Update user online status
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      });

      this.logger.log(`Client connected: ${user.name} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      // Update user offline status
      await this.prisma.user.update({
        where: { id: client.user.id },
        data: { isOnline: false, lastSeen: new Date() },
      });

      this.logger.log(`Client disconnected: ${client.user.name} (${client.id})`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;

    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return { error: 'Conversation not found' };
    }

    if (conversation.user1Id !== client.user.id && conversation.user2Id !== client.user.id) {
      return { error: 'Not part of this conversation' };
    }

    client.join(`conversation:${conversationId}`);
    this.logger.log(`${client.user.name} joined conversation ${conversationId}`);

    return { success: true };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`${client.user.name} left conversation ${conversationId}`);

    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; text: string },
  ) {
    const { conversationId, text } = data;

    try {
      const message = await this.messagesService.sendMessage(
        conversationId,
        client.user.id,
        text,
      );

      // Broadcast to all in the conversation room (including sender)
      this.server.to(`conversation:${conversationId}`).emit('new_message', {
        conversationId,
        message,
      });

      return { success: true, message };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;

    // Broadcast to others in the room (exclude sender)
    client.to(`conversation:${conversationId}`).emit('user_typing', {
      conversationId,
      userId: client.user.id,
      userName: client.user.name,
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;

    // Broadcast to others in the room (exclude sender)
    client.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      conversationId,
      userId: client.user.id,
    });

    return { success: true };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;

    try {
      await this.messagesService.markAsRead(conversationId, client.user.id);

      // Notify the other person their messages were read
      client.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        userId: client.user.id,
        readAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
}
