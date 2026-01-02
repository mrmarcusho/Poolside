import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './client';

// Socket server URL (without /v1 prefix)
const SOCKET_URL = __DEV__
  ? 'http://172.20.10.5:3000'
  : 'https://api.poolside.app';

let socket: Socket | null = null;

export interface SocketMessage {
  id: string;
  text: string;
  senderId: string;
  sentAt: string;
  readAt: string | null;
}

export interface NewMessageEvent {
  conversationId: string;
  message: SocketMessage;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface MessagesReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

export const socketService = {
  async connect(): Promise<Socket> {
    if (socket?.connected) {
      return socket;
    }

    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error('No access token available');
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket?.id);
        resolve(socket!);
      });

      socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        reject(error);
      });
    });
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('[Socket] Disconnected');
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },

  // Conversation room management
  joinConversation(conversationId: string): void {
    socket?.emit('join_conversation', { conversationId });
  },

  leaveConversation(conversationId: string): void {
    socket?.emit('leave_conversation', { conversationId });
  },

  // Messaging
  sendMessage(conversationId: string, text: string): void {
    socket?.emit('send_message', { conversationId, text });
  },

  // Typing indicators
  startTyping(conversationId: string): void {
    socket?.emit('typing_start', { conversationId });
  },

  stopTyping(conversationId: string): void {
    socket?.emit('typing_stop', { conversationId });
  },

  // Read receipts
  markAsRead(conversationId: string): void {
    socket?.emit('mark_read', { conversationId });
  },

  // Event listeners
  onNewMessage(callback: (data: NewMessageEvent) => void): void {
    socket?.on('new_message', callback);
  },

  offNewMessage(callback: (data: NewMessageEvent) => void): void {
    socket?.off('new_message', callback);
  },

  onUserTyping(callback: (data: TypingEvent) => void): void {
    socket?.on('user_typing', callback);
  },

  offUserTyping(callback: (data: TypingEvent) => void): void {
    socket?.off('user_typing', callback);
  },

  onUserStoppedTyping(callback: (data: TypingEvent) => void): void {
    socket?.on('user_stopped_typing', callback);
  },

  offUserStoppedTyping(callback: (data: TypingEvent) => void): void {
    socket?.off('user_stopped_typing', callback);
  },

  onMessagesRead(callback: (data: MessagesReadEvent) => void): void {
    socket?.on('messages_read', callback);
  },

  offMessagesRead(callback: (data: MessagesReadEvent) => void): void {
    socket?.off('messages_read', callback);
  },

  onDisconnect(callback: (reason: string) => void): void {
    socket?.on('disconnect', callback);
  },

  onReconnect(callback: () => void): void {
    socket?.on('connect', callback);
  },
};
