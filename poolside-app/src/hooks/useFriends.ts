import { useState, useEffect, useCallback } from 'react';
import { friendsService, Friend, FriendRequest } from '../api';

interface UseFriendsResult {
  friends: Friend[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriends = (): UseFriendsResult => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await friendsService.getFriends();
      setFriends(response.friends);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    await friendsService.removeFriend(friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }, []);

  return { friends, isLoading, error, refresh: fetchFriends, removeFriend };
};

interface UseFriendRequestsResult {
  requests: FriendRequest[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  accept: (requestId: string) => Promise<void>;
  reject: (requestId: string) => Promise<void>;
  send: (userId: string) => Promise<void>;
}

export const useFriendRequests = (): UseFriendRequestsResult => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await friendsService.getPendingRequests();
      setRequests(response.requests);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const accept = useCallback(async (requestId: string) => {
    await friendsService.acceptFriendRequest(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const reject = useCallback(async (requestId: string) => {
    await friendsService.rejectFriendRequest(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const send = useCallback(async (userId: string) => {
    await friendsService.sendFriendRequest(userId);
  }, []);

  return { requests, isLoading, error, refresh: fetchRequests, accept, reject, send };
};
