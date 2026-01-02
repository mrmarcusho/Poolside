import { useState, useEffect, useCallback, useRef } from 'react';
import {
  socketService,
  NewMessageEvent,
  TypingEvent,
  MessagesReadEvent,
  SocketMessage,
} from '../api/socket';
import { messagesService } from '../api';

interface UseChatOptions {
  conversationId: string;
  isSocketConnected: boolean;
}

interface UseChatResult {
  messages: SocketMessage[];
  isLoading: boolean;
  error: Error | null;
  isTyping: boolean;
  typingUserName: string | null;
  hasMore: boolean;
  sendMessage: (text: string) => void;
  loadMore: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
}

export const useChat = ({ conversationId, isSocketConnected }: UseChatOptions): UseChatResult => {
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const isMountedRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Load initial messages from REST API
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await messagesService.getMessages(conversationId);

      if (isMountedRef.current) {
        setMessages(response.messages.map(m => ({
          id: m.id,
          text: m.text,
          senderId: m.senderId,
          sentAt: m.sentAt,
          readAt: m.readAt,
        })));
        setHasMore(response.hasMore);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];

    try {
      const response = await messagesService.getMessages(
        conversationId,
        50,
        oldestMessage.sentAt,
      );

      if (isMountedRef.current) {
        setMessages(prev => [
          ...response.messages.map(m => ({
            id: m.id,
            text: m.text,
            senderId: m.senderId,
            sentAt: m.sentAt,
            readAt: m.readAt,
          })),
          ...prev,
        ]);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      console.error('[useChat] Load more error:', err);
    }
  }, [conversationId, hasMore, messages]);

  // Send message via WebSocket
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    socketService.sendMessage(conversationId, text.trim());
  }, [conversationId]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startTyping(conversationId);
    }

    // Reset the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.stopTyping(conversationId);
      }
    }, 3000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.stopTyping(conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    socketService.markAsRead(conversationId);
  }, [conversationId]);

  // Join conversation and set up listeners when socket is connected
  useEffect(() => {
    if (!isSocketConnected) {
      console.log('[useChat] Socket not connected, skipping listener setup');
      return;
    }

    console.log('[useChat] Setting up socket listeners for conversation:', conversationId);

    // Join the conversation room
    socketService.joinConversation(conversationId);

    // Handle new messages
    const handleNewMessage = (data: NewMessageEvent) => {
      console.log('[useChat] Received new_message event:', data);
      if (data.conversationId === conversationId && isMountedRef.current) {
        console.log('[useChat] Adding message to state');
        setMessages(prev => [...prev, data.message]);
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: TypingEvent) => {
      if (data.conversationId === conversationId && isMountedRef.current) {
        setIsTyping(true);
        setTypingUserName(data.userName || null);
      }
    };

    const handleUserStoppedTyping = (data: TypingEvent) => {
      if (data.conversationId === conversationId && isMountedRef.current) {
        setIsTyping(false);
        setTypingUserName(null);
      }
    };

    // Handle read receipts
    const handleMessagesRead = (data: MessagesReadEvent) => {
      if (data.conversationId === conversationId && isMountedRef.current) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          readAt: msg.readAt || data.readAt,
        })));
      }
    };

    // Register listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStoppedTyping(handleUserStoppedTyping);
    socketService.onMessagesRead(handleMessagesRead);
    console.log('[useChat] Socket listeners registered');

    // Cleanup
    return () => {
      console.log('[useChat] Cleaning up socket listeners');
      socketService.leaveConversation(conversationId);
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStoppedTyping(handleUserStoppedTyping);
      socketService.offMessagesRead(handleMessagesRead);
    };
  }, [conversationId, isSocketConnected]);

  // Load messages on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadMessages();

    return () => {
      isMountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    error,
    isTyping,
    typingUserName,
    hasMore,
    sendMessage,
    loadMore,
    startTyping,
    stopTyping,
    markAsRead,
  };
};
