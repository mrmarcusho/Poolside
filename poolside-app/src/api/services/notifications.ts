import { apiClient } from '../client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  hasMore: boolean;
}

export const notificationsService = {
  async getNotifications(
    type?: string,
    limit?: number,
    before?: string
  ): Promise<NotificationsResponse> {
    const response = await apiClient.get('/me/notifications', {
      params: { type, limit, before },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get('/me/notifications/unread-count');
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/me/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/me/notifications/read-all');
    return response.data;
  },
};
