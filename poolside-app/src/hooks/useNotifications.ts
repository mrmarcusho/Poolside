import { useState, useEffect, useCallback } from 'react';
import { notificationsService, Notification } from '../api';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchNotifications = useCallback(async (before?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const [notifResponse, countResponse] = await Promise.all([
        notificationsService.getNotifications(undefined, undefined, before),
        notificationsService.getUnreadCount(),
      ]);

      if (before) {
        setNotifications((prev) => [...prev, ...notifResponse.notifications]);
      } else {
        setNotifications(notifResponse.notifications);
      }
      setHasMore(notifResponse.hasMore);
      setUnreadCount(countResponse.unreadCount);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore && notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];
      await fetchNotifications(lastNotification.createdAt);
    }
  }, [isLoading, hasMore, notifications, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
};
