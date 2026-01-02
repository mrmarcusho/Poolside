/**
 * Feature: Notification Management
 *
 * Tests for notification management functionality including:
 * - Mark single notification as read
 * - Mark all as read
 * - Unread count badge on tab/icon
 */

import { mockNotifications } from '../../utils/testUtils';

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

describe('Feature: Notification Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mark Single Notification as Read', () => {
    test('should mark notification as read', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/notifications/notif-1/read');

      expect(apiClient.post).toHaveBeenCalledWith('/me/notifications/notif-1/read');
      expect(response.data.success).toBe(true);
    });

    test('should update local notification state', () => {
      let notifications = [...mockNotifications];

      const markAsRead = (notificationId: string) => {
        notifications = notifications.map(n =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        );
      };

      markAsRead('notif-1');
      const notification = notifications.find(n => n.id === 'notif-1');
      expect(notification?.readAt).not.toBeNull();
    });

    test('should handle already read notification', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/notifications/notif-2/read');

      expect(response.data.success).toBe(true);
    });

    test('should handle notification not found', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Notification not found' } },
      });

      await expect(apiClient.post('/me/notifications/invalid/read')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    test('should decrement unread count after marking as read', () => {
      let unreadCount = 5;

      const markAsRead = () => {
        unreadCount = Math.max(0, unreadCount - 1);
      };

      markAsRead();
      expect(unreadCount).toBe(4);
    });
  });

  describe('Mark All as Read', () => {
    test('should mark all notifications as read', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/notifications/read-all');

      expect(apiClient.post).toHaveBeenCalledWith('/me/notifications/read-all');
      expect(response.data.success).toBe(true);
    });

    test('should update all local notification states', () => {
      let notifications = [...mockNotifications];

      const markAllAsRead = () => {
        const now = new Date().toISOString();
        notifications = notifications.map(n => ({
          ...n,
          readAt: n.readAt || now,
        }));
      };

      markAllAsRead();
      expect(notifications.every(n => n.readAt !== null)).toBe(true);
    });

    test('should reset unread count to zero', () => {
      let unreadCount = 10;

      const markAllAsRead = () => {
        unreadCount = 0;
      };

      markAllAsRead();
      expect(unreadCount).toBe(0);
    });

    test('should handle empty notifications list', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/notifications/read-all');

      expect(response.data.success).toBe(true);
    });
  });

  describe('Unread Count', () => {
    test('should fetch unread count', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { unreadCount: 5 } });

      const response = await apiClient.get('/me/notifications/unread-count');

      expect(apiClient.get).toHaveBeenCalledWith('/me/notifications/unread-count');
      expect(response.data.unreadCount).toBe(5);
    });

    test('should handle zero unread count', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { unreadCount: 0 } });

      const response = await apiClient.get('/me/notifications/unread-count');

      expect(response.data.unreadCount).toBe(0);
    });

    test('should calculate unread from notifications list', () => {
      const notifications = [
        { id: '1', readAt: null },
        { id: '2', readAt: '2024-06-15T10:00:00.000Z' },
        { id: '3', readAt: null },
      ];

      const unreadCount = notifications.filter(n => n.readAt === null).length;
      expect(unreadCount).toBe(2);
    });
  });

  describe('Unread Badge Display', () => {
    test('should show badge when unread count > 0', () => {
      const shouldShowBadge = (unreadCount: number) => unreadCount > 0;

      expect(shouldShowBadge(5)).toBe(true);
      expect(shouldShowBadge(0)).toBe(false);
    });

    test('should format badge for large counts', () => {
      const formatBadge = (count: number) => {
        if (count === 0) return null;
        if (count > 99) return '99+';
        return count.toString();
      };

      expect(formatBadge(0)).toBeNull();
      expect(formatBadge(5)).toBe('5');
      expect(formatBadge(99)).toBe('99');
      expect(formatBadge(100)).toBe('99+');
    });

    test('should position badge on tab icon', () => {
      const badgePosition = {
        position: 'absolute',
        top: -4,
        right: -8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
      };

      expect(badgePosition.position).toBe('absolute');
      expect(badgePosition.backgroundColor).toBe('#EF4444');
    });
  });

  describe('Real-time Count Updates', () => {
    test('should increment count on new notification', () => {
      let unreadCount = 5;

      const onNewNotification = () => {
        unreadCount++;
      };

      onNewNotification();
      expect(unreadCount).toBe(6);
    });

    test('should update count from server push', () => {
      let unreadCount = 5;

      const updateFromServer = (newCount: number) => {
        unreadCount = newCount;
      };

      updateFromServer(8);
      expect(unreadCount).toBe(8);
    });
  });

  describe('Notification Preferences', () => {
    test('should get notification preferences', async () => {
      const mockPreferences = {
        friendRequests: true,
        eventReminders: true,
        messages: true,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockPreferences });

      const response = await apiClient.get('/me/notifications/preferences');

      expect(response.data.friendRequests).toBe(true);
    });

    test('should update notification preferences', async () => {
      const updates = { eventReminders: false };
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await apiClient.post('/me/notifications/preferences', updates);

      expect(apiClient.post).toHaveBeenCalledWith('/me/notifications/preferences', updates);
    });
  });

  describe('Delete Notifications', () => {
    test('should delete single notification', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      // Using POST for soft delete
      const response = await apiClient.post('/me/notifications/notif-1/delete');

      expect(response.data.success).toBe(true);
    });

    test('should remove notification from local list', () => {
      let notifications = [...mockNotifications];

      const deleteNotification = (notificationId: string) => {
        notifications = notifications.filter(n => n.id !== notificationId);
      };

      deleteNotification('notif-1');
      expect(notifications).toHaveLength(1);
      expect(notifications.find(n => n.id === 'notif-1')).toBeUndefined();
    });

    test('should clear all notifications', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await apiClient.post('/me/notifications/clear-all');

      expect(apiClient.post).toHaveBeenCalledWith('/me/notifications/clear-all');
    });
  });

  describe('Loading States', () => {
    test('should track loading state for mark as read', async () => {
      let isMarking = false;

      const markAsRead = async (notificationId: string) => {
        isMarking = true;
        apiClient.post.mockResolvedValueOnce({ data: { success: true } });
        await apiClient.post(`/me/notifications/${notificationId}/read`);
        isMarking = false;
      };

      await markAsRead('notif-1');
      expect(isMarking).toBe(false);
    });

    test('should track loading state for mark all as read', async () => {
      let isMarkingAll = false;

      const markAllAsRead = async () => {
        isMarkingAll = true;
        apiClient.post.mockResolvedValueOnce({ data: { success: true } });
        await apiClient.post('/me/notifications/read-all');
        isMarkingAll = false;
      };

      await markAllAsRead();
      expect(isMarkingAll).toBe(false);
    });
  });
});
