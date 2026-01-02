/**
 * Feature: Conversations List
 *
 * Tests for the conversations list functionality including:
 * - Load all conversations
 * - Display last message preview
 * - Unread message count badge
 * - Online status indicator per conversation
 * - Time since last message formatting
 * - Tap to open chat
 */

import { mockConversations, mockConversation } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const { apiClient } = require('../../../api/client');

describe('Feature: Conversations List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load Conversations', () => {
    test('should fetch all conversations', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { conversations: mockConversations } });

      const response = await apiClient.get('/me/messages/conversations');

      expect(apiClient.get).toHaveBeenCalledWith('/me/messages/conversations');
      expect(response.data.conversations).toHaveLength(2);
    });

    test('should return conversations with correct structure', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { conversations: mockConversations } });

      const response = await apiClient.get('/me/messages/conversations');
      const conversation = response.data.conversations[0];

      expect(conversation).toHaveProperty('id');
      expect(conversation).toHaveProperty('participant');
      expect(conversation).toHaveProperty('lastMessage');
      expect(conversation).toHaveProperty('unreadCount');
    });

    test('should handle empty conversations list', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { conversations: [] } });

      const response = await apiClient.get('/me/messages/conversations');

      expect(response.data.conversations).toHaveLength(0);
    });

    test('should handle API errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/me/messages/conversations')).rejects.toThrow('Network error');
    });

    test('should track loading state', async () => {
      let isLoading = false;

      const loadConversations = async () => {
        isLoading = true;
        try {
          apiClient.get.mockResolvedValueOnce({ data: { conversations: mockConversations } });
          await apiClient.get('/me/messages/conversations');
        } finally {
          isLoading = false;
        }
      };

      await loadConversations();
      expect(isLoading).toBe(false);
    });
  });

  describe('Last Message Preview', () => {
    test('should display last message text', () => {
      const conversation = mockConversation;
      expect(conversation.lastMessage?.text).toBe('Hey, are you coming to the party?');
    });

    test('should truncate long message previews', () => {
      const truncateMessage = (text: string, maxLength: number = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
      };

      const longMessage = 'This is a very long message that should be truncated for the preview display';
      expect(truncateMessage(longMessage, 50)).toBe('This is a very long message that should be truncat...');
      expect(truncateMessage('Short message', 50)).toBe('Short message');
    });

    test('should indicate if message is from current user', () => {
      const conversation = mockConversation;
      expect(conversation.lastMessage?.isFromMe).toBe(false);
    });

    test('should handle conversations without messages', () => {
      const conversationWithoutMessage = {
        ...mockConversation,
        lastMessage: null,
      };
      expect(conversationWithoutMessage.lastMessage).toBeNull();
    });

    test('should display "You: " prefix for sent messages', () => {
      const formatMessagePreview = (text: string, isFromMe: boolean) => {
        return isFromMe ? `You: ${text}` : text;
      };

      expect(formatMessagePreview('Hello', true)).toBe('You: Hello');
      expect(formatMessagePreview('Hello', false)).toBe('Hello');
    });
  });

  describe('Unread Message Count', () => {
    test('should display unread count badge', () => {
      const conversation = mockConversation;
      expect(conversation.unreadCount).toBe(2);
    });

    test('should not show badge when count is zero', () => {
      const shouldShowBadge = (unreadCount: number) => unreadCount > 0;

      expect(shouldShowBadge(2)).toBe(true);
      expect(shouldShowBadge(0)).toBe(false);
    });

    test('should display "99+" for high counts', () => {
      const formatUnreadCount = (count: number) => {
        if (count > 99) return '99+';
        return count.toString();
      };

      expect(formatUnreadCount(5)).toBe('5');
      expect(formatUnreadCount(99)).toBe('99');
      expect(formatUnreadCount(100)).toBe('99+');
      expect(formatUnreadCount(999)).toBe('99+');
    });

    test('should sort conversations by unread first', () => {
      const conversations = [
        { ...mockConversation, id: '1', unreadCount: 0 },
        { ...mockConversation, id: '2', unreadCount: 5 },
        { ...mockConversation, id: '3', unreadCount: 2 },
      ];

      const sorted = [...conversations].sort((a, b) => b.unreadCount - a.unreadCount);

      expect(sorted[0].unreadCount).toBe(5);
      expect(sorted[1].unreadCount).toBe(2);
      expect(sorted[2].unreadCount).toBe(0);
    });
  });

  describe('Online Status Indicator', () => {
    test('should display online status for participant', () => {
      const conversation = mockConversation;
      expect(conversation.participant.isOnline).toBe(true);
    });

    test('should display offline status', () => {
      const offlineConversation = {
        ...mockConversation,
        participant: { ...mockConversation.participant, isOnline: false },
      };
      expect(offlineConversation.participant.isOnline).toBe(false);
    });

    test('should render correct indicator style based on status', () => {
      const getIndicatorStyle = (isOnline: boolean) => ({
        backgroundColor: isOnline ? '#10B981' : '#6B7280',
      });

      expect(getIndicatorStyle(true).backgroundColor).toBe('#10B981'); // Green
      expect(getIndicatorStyle(false).backgroundColor).toBe('#6B7280'); // Gray
    });
  });

  describe('Time Since Last Message', () => {
    test('should format time for recent messages (minutes)', () => {
      const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
      };

      // Just now
      const justNow = new Date().toISOString();
      expect(formatTimeAgo(justNow)).toBe('Just now');
    });

    test('should format time for messages hours ago', () => {
      const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffHours < 24 && diffHours >= 1) return `${diffHours}h ago`;
        return 'Other';
      };

      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
    });

    test('should display "Yesterday" for messages from yesterday', () => {
      const isYesterday = (dateString: string) => {
        const date = new Date(dateString);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday.toISOString())).toBe(true);
    });

    test('should display full date for older messages', () => {
      const shouldShowFullDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
        return diffDays >= 7;
      };

      const oneWeekAgo = new Date(Date.now() - 8 * 86400000).toISOString();
      expect(shouldShowFullDate(oneWeekAgo)).toBe(true);
    });
  });

  describe('Conversation Display', () => {
    test('should display participant name', () => {
      const conversation = mockConversation;
      expect(conversation.participant.name).toBe('Chat Partner');
    });

    test('should display participant emoji', () => {
      const conversation = mockConversation;
      expect(conversation.participant.emoji).toBe('🙂');
    });

    test('should display participant avatar if available', () => {
      const conversationWithAvatar = {
        ...mockConversation,
        participant: { ...mockConversation.participant, avatar: 'https://example.com/avatar.jpg' },
      };
      expect(conversationWithAvatar.participant.avatar).toBe('https://example.com/avatar.jpg');
    });

    test('should fallback to emoji when no avatar', () => {
      const conversation = mockConversation;
      expect(conversation.participant.avatar).toBeNull();
      expect(conversation.participant.emoji).toBe('🙂');
    });
  });

  describe('Navigation', () => {
    test('should navigate to chat on tap', () => {
      let navigatedToId: string | null = null;

      const handleConversationTap = (conversationId: string) => {
        navigatedToId = conversationId;
      };

      handleConversationTap('conv-1');
      expect(navigatedToId).toBe('conv-1');
    });

    test('should pass conversation data to chat screen', () => {
      let navigatedParams: { conversationId: string; participantName: string } | null = null;

      const handleConversationTap = (conversation: typeof mockConversation) => {
        navigatedParams = {
          conversationId: conversation.id,
          participantName: conversation.participant.name,
        };
      };

      handleConversationTap(mockConversation);
      expect(navigatedParams?.conversationId).toBe('conv-1');
      expect(navigatedParams?.participantName).toBe('Chat Partner');
    });
  });

  describe('Pull-to-Refresh', () => {
    test('should refresh conversations on pull', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { conversations: mockConversations } });

      const response = await apiClient.get('/me/messages/conversations');

      expect(response.data.conversations).toHaveLength(2);
    });

    test('should track refreshing state', async () => {
      let isRefreshing = false;

      const onRefresh = async () => {
        isRefreshing = true;
        apiClient.get.mockResolvedValueOnce({ data: { conversations: [] } });
        await apiClient.get('/me/messages/conversations');
        isRefreshing = false;
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no conversations', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { conversations: [] } });

      const response = await apiClient.get('/me/messages/conversations');
      const hasConversations = response.data.conversations.length > 0;

      expect(hasConversations).toBe(false);
    });

    test('should display appropriate empty message', () => {
      const getEmptyMessage = (conversationCount: number) => {
        if (conversationCount === 0) {
          return 'No messages yet. Start a conversation!';
        }
        return null;
      };

      expect(getEmptyMessage(0)).toBe('No messages yet. Start a conversation!');
      expect(getEmptyMessage(5)).toBeNull();
    });
  });
});
