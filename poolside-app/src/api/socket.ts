import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './client';

// Socket server URL (without /v1 prefix)
const SOCKET_URL = __DEV__
  ? 'http://10.243.20.219:3000'
  : 'https://api.poolside.app';

let socket: Socket | null = null;
let isConnecting = false;

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

// Event Chat interfaces
export interface ReplyTo {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
}

export interface EventChatMessage {
  id: string;
  text: string;
  imageUrl?: string | null;
  senderId: string;
  senderName: string;
  senderEmoji: string;
  senderAvatar: string | null;
  sentAt: string;
  replyTo: ReplyTo | null;
  replyCount: number;
}

export interface NewEventMessageEvent {
  eventId: string;
  message: EventChatMessage;
}

export interface MessageRepliesResponse {
  originalMessage: Omit<EventChatMessage, 'replyTo' | 'replyCount'>;
  replies: Omit<EventChatMessage, 'replyTo' | 'replyCount'>[];
}

export interface EventTypingEvent {
  eventId: string;
  userId: string;
  userName?: string;
}

export interface EventRsvpUpdatedEvent {
  eventId: string;
  rsvpCount: {
    going: number;
    interested: number;
  };
  isFull: boolean;
  spots: number | null;
  userId: string; // The user who triggered the RSVP change
}

export const socketService = {
  async connect(): Promise<Socket> {
    // Already connected - return existing socket
    if (socket?.connected) {
      return socket;
    }

    // Already attempting to connect - don't start another attempt
    if (isConnecting) {
      // Wait for the existing connection attempt
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!isConnecting) {
            clearInterval(checkInterval);
            if (socket?.connected) {
              resolve(socket);
            } else {
              reject(new Error('Connection failed'));
            }
          }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Connection timeout'));
        }, 15000);
      });
    }

    // If socket exists but is disconnected, wait for Socket.IO's auto-reconnection
    // instead of destroying the socket and losing all listeners
    if (socket && !socket.connected) {
      console.log('[Socket] Socket exists but disconnected, waiting for auto-reconnect...');
      return new Promise((resolve, reject) => {
        const reconnectTimeout = setTimeout(() => {
          console.log('[Socket] Auto-reconnect timeout, creating new socket');
          socket?.removeAllListeners();
          socket?.disconnect();
          socket = null;
          // Retry connection with new socket
          socketService.connect().then(resolve).catch(reject);
        }, 5000);

        socket!.once('connect', () => {
          console.log('[Socket] Auto-reconnected successfully');
          clearTimeout(reconnectTimeout);
          resolve(socket!);
        });
      });
    }

    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error('No access token available');
    }

    isConnecting = true;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    return new Promise((resolve, reject) => {
      if (!socket) {
        isConnecting = false;
        reject(new Error('Socket not initialized'));
        return;
      }

      let settled = false;
      const connectionTimeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          // Clean up the socket on timeout to prevent background errors
          if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            socket = null;
          }
          isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      const cleanup = () => {
        socket?.off('connect', onConnect);
        socket?.off('connect_error', onError);
      };

      const onConnect = () => {
        if (!settled) {
          settled = true;
          clearTimeout(connectionTimeout);
          cleanup();
          isConnecting = false;
          console.log('[Socket] Connected:', socket?.id);

          // Debug listener to see all new_event_message events
          socket?.on('new_event_message', (data) => {
            console.log('[Socket] DEBUG: Raw new_event_message received:', data.eventId);
          });

          // Debug listener for RSVP updates
          socket?.on('event_rsvp_updated', (data) => {
            console.log('[Socket] DEBUG: Raw event_rsvp_updated received:', JSON.stringify(data));
          });

          resolve(socket!);
        }
      };

      const onError = (error: Error) => {
        if (!settled) {
          settled = true;
          clearTimeout(connectionTimeout);
          cleanup();
          // Clean up the socket on error to prevent background reconnection errors
          if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            socket = null;
          }
          isConnecting = false;
          // Use warn instead of error to avoid red box in React Native
          console.warn('[Socket] Connection failed:', error.message);
          reject(error);
        }
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
    });
  },

  disconnect(): void {
    isConnecting = false;
    if (socket) {
      socket.removeAllListeners();
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

  // Check if socket instance exists (for debugging)
  hasSocket(): boolean {
    return socket !== null;
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

  // ============== EVENT CHAT ==============

  // Event chat room management
  joinEventChat(eventId: string): void {
    socket?.emit('join_event_chat', { eventId });
  },

  leaveEventChat(eventId: string): void {
    socket?.emit('leave_event_chat', { eventId });
  },

  // Event chat messaging
  sendEventMessage(eventId: string, text: string, replyToId?: string, imageUrl?: string): void {
    socket?.emit('send_event_message', { eventId, text, replyToId, imageUrl });
  },

  // Get replies to a message (for thread view)
  getMessageReplies(messageId: string): Promise<MessageRepliesResponse | null> {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        console.log('[Socket] getMessageReplies: Socket not connected');
        resolve(null);
        return;
      }

      console.log('[Socket] getMessageReplies: Requesting replies for message:', messageId);

      // Set a timeout in case the acknowledgment never comes
      const timeout = setTimeout(() => {
        console.log('[Socket] getMessageReplies: Timeout - no response received');
        resolve(null);
      }, 10000);

      socket.emit('get_message_replies', { messageId }, (response: any) => {
        clearTimeout(timeout);
        console.log('[Socket] getMessageReplies: Response received:', response);
        if (response && response.success) {
          resolve({
            originalMessage: response.originalMessage,
            replies: response.replies,
          });
        } else {
          console.log('[Socket] getMessageReplies: Error or no success:', response?.error);
          resolve(null);
        }
      });
    });
  },

  // Event chat typing indicators
  startEventTyping(eventId: string): void {
    socket?.emit('event_typing_start', { eventId });
  },

  stopEventTyping(eventId: string): void {
    socket?.emit('event_typing_stop', { eventId });
  },

  // Event chat event listeners
  onNewEventMessage(callback: (data: NewEventMessageEvent) => void): void {
    if (!socket) {
      console.error('[Socket] ERROR: Cannot register new_event_message listener - socket is null!');
      return;
    }
    if (!socket.connected) {
      console.warn('[Socket] WARNING: Registering listener but socket is not connected yet');
    }
    const listenerCount = socket.listeners('new_event_message').length || 0;
    console.log('[Socket] Registering new_event_message listener. Socket connected:', socket.connected, 'Current listener count:', listenerCount);
    socket.on('new_event_message', callback);
    const newListenerCount = socket.listeners('new_event_message').length || 0;
    console.log('[Socket] After registration, listener count:', newListenerCount);
  },

  offNewEventMessage(callback: (data: NewEventMessageEvent) => void): void {
    if (!socket) {
      console.warn('[Socket] Cannot remove listener - socket is null');
      return;
    }
    const listenerCount = socket.listeners('new_event_message').length || 0;
    console.log('[Socket] Removing new_event_message listener. Current listener count:', listenerCount);
    socket.off('new_event_message', callback);
    const newListenerCount = socket.listeners('new_event_message').length || 0;
    console.log('[Socket] After removal, listener count:', newListenerCount);
  },

  onEventUserTyping(callback: (data: EventTypingEvent) => void): void {
    socket?.on('event_user_typing', callback);
  },

  offEventUserTyping(callback: (data: EventTypingEvent) => void): void {
    socket?.off('event_user_typing', callback);
  },

  onEventUserStoppedTyping(callback: (data: EventTypingEvent) => void): void {
    socket?.on('event_user_stopped_typing', callback);
  },

  offEventUserStoppedTyping(callback: (data: EventTypingEvent) => void): void {
    socket?.off('event_user_stopped_typing', callback);
  },

  // ============== RSVP UPDATES ==============

  onEventRsvpUpdated(callback: (data: EventRsvpUpdatedEvent) => void): void {
    if (!socket) {
      console.error('[Socket] ERROR: Cannot register event_rsvp_updated listener - socket is null!');
      return;
    }
    console.log('[Socket] Registering event_rsvp_updated listener, socket connected:', socket.connected);
    socket.on('event_rsvp_updated', callback);
  },

  offEventRsvpUpdated(callback: (data: EventRsvpUpdatedEvent) => void): void {
    socket?.off('event_rsvp_updated', callback);
  },
};
