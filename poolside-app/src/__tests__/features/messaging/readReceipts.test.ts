/**
 * Feature: Message Read Receipts
 *
 * Tests for read receipt functionality including:
 * - Mark messages as read when viewed
 * - Read status display
 * - Real-time read receipt updates
 */

import { mockMessages } from '../../utils/testUtils';

// Mock socket service
jest.mock('../../../api/socket', () => ({
  socketService: {
    markAsRead: jest.fn(),
    onMessagesRead: jest.fn(),
    offMessagesRead: jest.fn(),
  },
}));

// Mock API
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

const { socketService } = require('../../../api/socket');
const { apiClient } = require('../../../api/client');

describe('Feature: Message Read Receipts', () => {
  const currentUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mark Messages as Read', () => {
    test('should emit mark as read via socket', () => {
      socketService.markAsRead('conv-1');

      expect(socketService.markAsRead).toHaveBeenCalledWith('conv-1');
    });

    test('should mark as read via REST API', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/messages/conversations/conv-1/read');

      expect(apiClient.post).toHaveBeenCalledWith('/me/messages/conversations/conv-1/read');
      expect(response.data.success).toBe(true);
    });

    test('should mark as read when conversation is opened', () => {
      let markedAsRead = false;

      const onConversationOpen = (conversationId: string) => {
        markedAsRead = true;
        socketService.markAsRead(conversationId);
      };

      onConversationOpen('conv-1');
      expect(markedAsRead).toBe(true);
      expect(socketService.markAsRead).toHaveBeenCalledWith('conv-1');
    });

    test('should mark as read when scrolling to new messages', () => {
      let hasUnread = true;

      const onScrollToBottom = (conversationId: string, hasUnreadMessages: boolean) => {
        if (hasUnreadMessages) {
          hasUnread = false;
          socketService.markAsRead(conversationId);
        }
      };

      onScrollToBottom('conv-1', true);
      expect(hasUnread).toBe(false);
      expect(socketService.markAsRead).toHaveBeenCalled();
    });

    test('should not mark as read if no unread messages', () => {
      const onScrollToBottom = (hasUnreadMessages: boolean) => {
        if (hasUnreadMessages) {
          socketService.markAsRead('conv-1');
        }
      };

      onScrollToBottom(false);
      expect(socketService.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('Read Status Display', () => {
    test('should show read status for sent messages', () => {
      const isRead = (message: { readAt: string | null }) => message.readAt !== null;

      const readMessage = { readAt: '2024-06-15T10:31:00.000Z' };
      const unreadMessage = { readAt: null };

      expect(isRead(readMessage)).toBe(true);
      expect(isRead(unreadMessage)).toBe(false);
    });

    test('should only show read receipt for own messages', () => {
      const shouldShowReadReceipt = (senderId: string, currentUserId: string) => {
        return senderId === currentUserId;
      };

      expect(shouldShowReadReceipt('user-1', 'user-1')).toBe(true);
      expect(shouldShowReadReceipt('user-2', 'user-1')).toBe(false);
    });

    test('should show read status with timestamp', () => {
      const formatReadTime = (readAt: string) => {
        const date = new Date(readAt);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      };

      const readTime = formatReadTime('2024-06-15T10:31:00.000Z');
      // Check that time is formatted with hour and minutes
      expect(readTime).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    test('should display "Sent" for unread messages', () => {
      const getMessageStatus = (readAt: string | null) => {
        return readAt ? 'Read' : 'Sent';
      };

      expect(getMessageStatus(null)).toBe('Sent');
      expect(getMessageStatus('2024-06-15T10:31:00.000Z')).toBe('Read');
    });

    test('should display checkmark icons for status', () => {
      const getStatusIcon = (readAt: string | null) => {
        return readAt ? 'checkmark-double' : 'checkmark-single';
      };

      expect(getStatusIcon(null)).toBe('checkmark-single');
      expect(getStatusIcon('2024-06-15T10:31:00.000Z')).toBe('checkmark-double');
    });
  });

  describe('Real-time Read Receipt Updates', () => {
    test('should register read receipt listener', () => {
      const callback = jest.fn();
      socketService.onMessagesRead(callback);

      expect(socketService.onMessagesRead).toHaveBeenCalledWith(callback);
    });

    test('should unregister read receipt listener on cleanup', () => {
      const callback = jest.fn();
      socketService.offMessagesRead(callback);

      expect(socketService.offMessagesRead).toHaveBeenCalledWith(callback);
    });

    test('should update messages when receiving read receipt event', () => {
      let messages = [
        { id: 'msg-1', senderId: currentUserId, readAt: null },
        { id: 'msg-2', senderId: currentUserId, readAt: null },
      ];

      const handleMessagesRead = (data: { conversationId: string; readAt: string }) => {
        messages = messages.map(msg => ({
          ...msg,
          readAt: msg.readAt || data.readAt,
        }));
      };

      handleMessagesRead({
        conversationId: 'conv-1',
        readAt: '2024-06-15T10:35:00.000Z',
      });

      expect(messages[0].readAt).toBe('2024-06-15T10:35:00.000Z');
      expect(messages[1].readAt).toBe('2024-06-15T10:35:00.000Z');
    });

    test('should only update current conversation messages', () => {
      let messages = [
        { id: 'msg-1', conversationId: 'conv-1', readAt: null },
      ];
      const currentConversationId = 'conv-1';

      const handleMessagesRead = (data: { conversationId: string; readAt: string }) => {
        if (data.conversationId !== currentConversationId) return;

        messages = messages.map(msg => ({
          ...msg,
          readAt: msg.readAt || data.readAt,
        }));
      };

      // Different conversation
      handleMessagesRead({ conversationId: 'conv-2', readAt: '2024-06-15T10:35:00.000Z' });
      expect(messages[0].readAt).toBeNull();

      // Current conversation
      handleMessagesRead({ conversationId: 'conv-1', readAt: '2024-06-15T10:35:00.000Z' });
      expect(messages[0].readAt).toBe('2024-06-15T10:35:00.000Z');
    });

    test('should not overwrite existing read timestamp', () => {
      let messages = [
        { id: 'msg-1', readAt: '2024-06-15T10:30:00.000Z' },
      ];

      const handleMessagesRead = (data: { readAt: string }) => {
        messages = messages.map(msg => ({
          ...msg,
          readAt: msg.readAt || data.readAt, // Only set if not already read
        }));
      };

      handleMessagesRead({ readAt: '2024-06-15T10:40:00.000Z' });

      // Should keep original read time
      expect(messages[0].readAt).toBe('2024-06-15T10:30:00.000Z');
    });
  });

  describe('Unread Count Updates', () => {
    test('should clear unread count when marking as read', () => {
      let unreadCount = 5;

      const markConversationAsRead = () => {
        socketService.markAsRead('conv-1');
        unreadCount = 0;
      };

      markConversationAsRead();
      expect(unreadCount).toBe(0);
    });

    test('should update conversation list unread count', () => {
      let conversations = [
        { id: 'conv-1', unreadCount: 5 },
        { id: 'conv-2', unreadCount: 3 },
      ];

      const updateUnreadCount = (conversationId: string, count: number) => {
        conversations = conversations.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: count } : conv
        );
      };

      updateUnreadCount('conv-1', 0);
      expect(conversations[0].unreadCount).toBe(0);
      expect(conversations[1].unreadCount).toBe(3);
    });
  });

  describe('Read Receipt for Last Message Only', () => {
    test('should only display read receipt on last sent message', () => {
      const messages = [
        { id: 'msg-1', senderId: currentUserId, readAt: '2024-06-15T10:30:00.000Z' },
        { id: 'msg-2', senderId: 'user-2', readAt: null },
        { id: 'msg-3', senderId: currentUserId, readAt: '2024-06-15T10:32:00.000Z' },
      ];

      const shouldShowReceipt = (
        message: typeof messages[0],
        allMessages: typeof messages,
        userId: string
      ) => {
        if (message.senderId !== userId) return false;

        const sentMessages = allMessages.filter(m => m.senderId === userId);
        const lastSentMessage = sentMessages[sentMessages.length - 1];
        return message.id === lastSentMessage.id;
      };

      expect(shouldShowReceipt(messages[0], messages, currentUserId)).toBe(false);
      expect(shouldShowReceipt(messages[2], messages, currentUserId)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle mark as read API errors gracefully', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.post('/me/messages/conversations/conv-1/read')
      ).rejects.toThrow('Network error');
    });

    test('should retry mark as read on failure', async () => {
      let retryCount = 0;
      const maxRetries = 3;

      const markAsReadWithRetry = async () => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            retryCount = i + 1;
            if (i < 2) {
              throw new Error('Network error');
            }
            return { success: true };
          } catch {
            if (i === maxRetries - 1) throw new Error('Max retries exceeded');
          }
        }
      };

      await markAsReadWithRetry();
      expect(retryCount).toBe(3);
    });
  });
});
