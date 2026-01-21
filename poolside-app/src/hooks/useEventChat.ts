import { useState, useEffect, useCallback, useRef } from 'react';
import {
  socketService,
  NewEventMessageEvent,
  EventTypingEvent,
  EventChatMessage,
  ReplyTo,
  MessageRepliesResponse,
} from '../api/socket';
import { eventChatService } from '../api/services/eventChat';

interface UseEventChatOptions {
  eventId: string;
  isSocketConnected: boolean;
}

interface ReplyingTo {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
}

interface UseEventChatResult {
  messages: EventChatMessage[];
  isLoading: boolean;
  error: Error | null;
  isTyping: boolean;
  typingUserName: string | null;
  hasMore: boolean;
  replyingTo: ReplyingTo | null;
  setReplyingTo: (message: ReplyingTo | null) => void;
  sendMessage: (text: string, imageUrl?: string) => void;
  loadMore: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  getMessageReplies: (messageId: string) => Promise<MessageRepliesResponse | null>;
}

export const useEventChat = ({ eventId, isSocketConnected }: UseEventChatOptions): UseEventChatResult => {
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);

  const isMountedRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Load initial messages from REST API
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await eventChatService.getEventMessages(eventId);

      if (isMountedRef.current) {
        setMessages(response.messages);
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
  }, [eventId]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];

    try {
      const response = await eventChatService.getEventMessages(
        eventId,
        50,
        oldestMessage.sentAt,
      );

      if (isMountedRef.current) {
        setMessages(prev => [...response.messages, ...prev]);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      console.error('[useEventChat] Load more error:', err);
    }
  }, [eventId, hasMore, messages]);

  // Send message via WebSocket
  const sendMessage = useCallback((text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    socketService.sendEventMessage(eventId, text.trim(), replyingTo?.id, imageUrl);
    // Clear reply state after sending
    setReplyingTo(null);
  }, [eventId, replyingTo]);

  // Get replies to a message (for thread view)
  const getMessageReplies = useCallback(async (messageId: string): Promise<MessageRepliesResponse | null> => {
    return socketService.getMessageReplies(messageId);
  }, []);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startEventTyping(eventId);
    }

    // Reset the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.stopEventTyping(eventId);
      }
    }, 3000);
  }, [eventId]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.stopEventTyping(eventId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [eventId]);

  // Join event chat and set up listeners when socket is connected
  useEffect(() => {
    if (!isSocketConnected) {
      console.log('[useEventChat] Socket not connected, skipping listener setup');
      return;
    }

    console.log('[useEventChat] Setting up socket listeners for event:', eventId);

    // Join the event chat room
    socketService.joinEventChat(eventId);

    // Handle new messages
    const handleNewMessage = (data: NewEventMessageEvent) => {
      if (data.eventId === eventId && isMountedRef.current) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: EventTypingEvent) => {
      if (data.eventId === eventId && isMountedRef.current) {
        setIsTyping(true);
        setTypingUserName(data.userName || null);
      }
    };

    const handleUserStoppedTyping = (data: EventTypingEvent) => {
      if (data.eventId === eventId && isMountedRef.current) {
        setIsTyping(false);
        setTypingUserName(null);
      }
    };

    // Register listeners
    socketService.onNewEventMessage(handleNewMessage);
    socketService.onEventUserTyping(handleUserTyping);
    socketService.onEventUserStoppedTyping(handleUserStoppedTyping);
    console.log('[useEventChat] Socket listeners registered');

    // Cleanup - only remove listeners, do NOT leave the room
    // Room membership is managed by FriendsScreen which needs to stay in all event rooms
    // to receive real-time unread count updates. Leaving the room here would kick
    // the user out of the room that FriendsScreen expects them to be in.
    return () => {
      console.log('[useEventChat] Cleaning up socket listeners (keeping room membership)');
      socketService.offNewEventMessage(handleNewMessage);
      socketService.offEventUserTyping(handleUserTyping);
      socketService.offEventUserStoppedTyping(handleUserStoppedTyping);
    };
  }, [eventId, isSocketConnected]);

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
    replyingTo,
    setReplyingTo,
    sendMessage,
    loadMore,
    startTyping,
    stopTyping,
    getMessageReplies,
  };
};
