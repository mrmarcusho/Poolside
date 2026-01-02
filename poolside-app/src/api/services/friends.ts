import { apiClient } from '../client';

export interface Friend {
  id: string;
  name: string;
  emoji: string | null;
  avatar: string | null;
  isOnline: boolean;
  friendsSince: string;
}

export interface FriendRequest {
  id: string;
  from: {
    id: string;
    name: string;
    emoji: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

export const friendsService = {
  async getFriends(): Promise<{ friends: Friend[] }> {
    const response = await apiClient.get('/me/friends');
    return response.data;
  },

  async sendFriendRequest(userId: string): Promise<{
    requestId: string;
    toUser: { id: string; name: string };
    status: string;
    createdAt: string;
  }> {
    const response = await apiClient.post('/me/friends/request', { userId });
    return response.data;
  },

  async getPendingRequests(): Promise<{ requests: FriendRequest[] }> {
    const response = await apiClient.get('/me/friends/requests');
    return response.data;
  },

  async acceptFriendRequest(requestId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/me/friends/requests/${requestId}/accept`);
    return response.data;
  },

  async rejectFriendRequest(requestId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/me/friends/requests/${requestId}/reject`);
    return response.data;
  },

  async removeFriend(friendId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/me/friends/${friendId}`);
    return response.data;
  },
};
