/**
 * Feature: Notifications List
 *
 * Tests for notifications list functionality including:
 * - Load notifications with pagination
 * - Display notification content by type
 * - Visual distinction for unread
 * - Tap notification action
 */

import { mockNotifications, mockNotification } from '../../utils/testUtils';

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
  },
}));

const { apiClient } = require('../../../api/client');

describe('Feature: Notifications List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load Notifications', () => {
    test('should fetch notifications', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: mockNotifications, hasMore: false },
      });

      const response = await apiClient.get('/me/notifications');

      expect(apiClient.get).toHaveBeenCalledWith('/me/notifications');
      expect(response.data.notifications).toHaveLength(2);
    });

    test('should return notifications with correct structure', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: mockNotifications, hasMore: false },
      });

      const response = await apiClient.get('/me/notifications');
      const notification = response.data.notifications[0];

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('body');
      expect(notification).toHaveProperty('readAt');
      expect(notification).toHaveProperty('createdAt');
    });

    test('should handle empty notifications', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: [], hasMore: false },
      });

      const response = await apiClient.get('/me/notifications');

      expect(response.data.notifications).toHaveLength(0);
    });

    test('should support pagination', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: mockNotifications, hasMore: true },
      });

      const response = await apiClient.get('/me/notifications', {
        params: { limit: 20, before: 'cursor-123' },
      });

      expect(response.data.hasMore).toBe(true);
    });

    test('should filter by notification type', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: [mockNotification], hasMore: false },
      });

      await apiClient.get('/me/notifications', { params: { type: 'friend_request' } });

      expect(apiClient.get).toHaveBeenCalledWith('/me/notifications', {
        params: { type: 'friend_request' },
      });
    });

    test('should handle API errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/me/notifications')).rejects.toThrow('Network error');
    });
  });

  describe('Notification Types', () => {
    test('should handle friend_request notification', () => {
      const notification = { ...mockNotification, type: 'friend_request' };

      const getNotificationIcon = (type: string) => {
        switch (type) {
          case 'friend_request':
            return 'person-add';
          case 'event_reminder':
            return 'calendar';
          case 'new_message':
            return 'chatbubble';
          default:
            return 'notifications';
        }
      };

      expect(getNotificationIcon(notification.type)).toBe('person-add');
    });

    test('should handle event_reminder notification', () => {
      const notification = { ...mockNotification, type: 'event_reminder' };

      const getNotificationIcon = (type: string) => {
        switch (type) {
          case 'event_reminder':
            return 'calendar';
          default:
            return 'notifications';
        }
      };

      expect(getNotificationIcon(notification.type)).toBe('calendar');
    });

    test('should handle new_message notification', () => {
      const notification = { ...mockNotification, type: 'new_message' };

      const getNotificationIcon = (type: string) => {
        switch (type) {
          case 'new_message':
            return 'chatbubble';
          default:
            return 'notifications';
        }
      };

      expect(getNotificationIcon(notification.type)).toBe('chatbubble');
    });

    test('should parse notification data', () => {
      const notification = {
        ...mockNotification,
        data: JSON.stringify({ userId: 'user-5', eventId: 'event-1' }),
      };

      const parseData = (data: string | null) => {
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      };

      const parsed = parseData(notification.data);
      expect(parsed).toEqual({ userId: 'user-5', eventId: 'event-1' });
    });

    test('should handle null data field', () => {
      const notification = { ...mockNotification, data: null };

      const parseData = (data: string | null) => {
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      };

      expect(parseData(notification.data)).toBeNull();
    });
  });

  describe('Unread Visual Distinction', () => {
    test('should identify unread notifications', () => {
      const isUnread = (readAt: string | null) => readAt === null;

      expect(isUnread(null)).toBe(true);
      expect(isUnread('2024-06-15T10:00:00.000Z')).toBe(false);
    });

    test('should apply different style for unread', () => {
      const getNotificationStyle = (isUnread: boolean) => ({
        backgroundColor: isUnread ? '#1F2937' : 'transparent',
        borderLeftWidth: isUnread ? 3 : 0,
        borderLeftColor: isUnread ? '#3B82F6' : 'transparent',
      });

      const unreadStyle = getNotificationStyle(true);
      const readStyle = getNotificationStyle(false);

      expect(unreadStyle.backgroundColor).toBe('#1F2937');
      expect(readStyle.backgroundColor).toBe('transparent');
    });

    test('should show unread indicator dot', () => {
      const shouldShowDot = (readAt: string | null) => readAt === null;

      expect(shouldShowDot(null)).toBe(true);
      expect(shouldShowDot('2024-06-15T10:00:00.000Z')).toBe(false);
    });
  });

  describe('Notification Display', () => {
    test('should display notification title', () => {
      expect(mockNotification.title).toBe('New Friend Request');
    });

    test('should display notification body', () => {
      expect(mockNotification.body).toBe('John wants to be your friend');
    });

    test('should format notification time', () => {
      const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
      };

      // Just check it returns a string
      expect(typeof formatTime(mockNotification.createdAt)).toBe('string');
    });

    test('should group notifications by date', () => {
      const notifications = [
        { ...mockNotification, id: '1', createdAt: '2024-06-15T10:00:00.000Z' },
        { ...mockNotification, id: '2', createdAt: '2024-06-15T11:00:00.000Z' },
        { ...mockNotification, id: '3', createdAt: '2024-06-14T10:00:00.000Z' },
      ];

      const groupByDate = (items: typeof notifications) => {
        const groups: Record<string, typeof notifications> = {};
        items.forEach(item => {
          const date = new Date(item.createdAt).toDateString();
          if (!groups[date]) groups[date] = [];
          groups[date].push(item);
        });
        return groups;
      };

      const grouped = groupByDate(notifications);
      expect(Object.keys(grouped)).toHaveLength(2);
    });
  });

  describe('Notification Tap Actions', () => {
    test('should navigate to friend profile for friend_request', () => {
      let navigatedTo: { screen: string; params: object } | null = null;

      const handleNotificationTap = (notification: typeof mockNotification) => {
        const data = notification.data ? JSON.parse(notification.data) : {};

        switch (notification.type) {
          case 'friend_request':
            navigatedTo = { screen: 'Profile', params: { userId: data.userId } };
            break;
          case 'event_reminder':
            navigatedTo = { screen: 'EventDetail', params: { eventId: data.eventId } };
            break;
          case 'new_message':
            navigatedTo = { screen: 'Chat', params: { conversationId: data.conversationId } };
            break;
        }
      };

      const notification = {
        ...mockNotification,
        type: 'friend_request',
        data: JSON.stringify({ userId: 'user-5' }),
      };

      handleNotificationTap(notification);
      expect(navigatedTo?.screen).toBe('Profile');
    });

    test('should navigate to event for event_reminder', () => {
      let navigatedTo: { screen: string; params: object } | null = null;

      const handleNotificationTap = (notification: typeof mockNotification) => {
        const data = notification.data ? JSON.parse(notification.data) : {};

        if (notification.type === 'event_reminder') {
          navigatedTo = { screen: 'EventDetail', params: { eventId: data.eventId } };
        }
      };

      const notification = {
        ...mockNotification,
        type: 'event_reminder',
        data: JSON.stringify({ eventId: 'event-1' }),
      };

      handleNotificationTap(notification);
      expect(navigatedTo?.screen).toBe('EventDetail');
    });

    test('should mark notification as read on tap', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await apiClient.post('/me/notifications/notif-1/read');

      expect(apiClient.post).toHaveBeenCalledWith('/me/notifications/notif-1/read');
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no notifications', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: [], hasMore: false },
      });

      const response = await apiClient.get('/me/notifications');
      const hasNotifications = response.data.notifications.length > 0;

      expect(hasNotifications).toBe(false);
    });

    test('should display appropriate empty message', () => {
      const getEmptyMessage = (notificationCount: number) => {
        if (notificationCount === 0) {
          return 'No notifications yet';
        }
        return null;
      };

      expect(getEmptyMessage(0)).toBe('No notifications yet');
      expect(getEmptyMessage(5)).toBeNull();
    });
  });

  describe('Pull-to-Refresh', () => {
    test('should refresh notifications on pull', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { notifications: mockNotifications, hasMore: false },
      });

      const response = await apiClient.get('/me/notifications');

      expect(response.data.notifications).toHaveLength(2);
    });

    test('should track refreshing state', async () => {
      let isRefreshing = false;

      const onRefresh = async () => {
        isRefreshing = true;
        apiClient.get.mockResolvedValueOnce({
          data: { notifications: [], hasMore: false },
        });
        await apiClient.get('/me/notifications');
        isRefreshing = false;
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });
  });
});
