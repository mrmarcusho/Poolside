import { apiClient } from '../client';
import { User } from '../../types';

export interface Interest {
  emoji: string;
  label: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  emoji: string | null;
  avatar: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  school: string | null;
  interests: Interest[] | null;
  createdAt: string;
}

export interface SearchUser {
  id: string;
  name: string;
  emoji: string | null;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
}

export interface UpdateProfileData {
  name?: string;
  emoji?: string | null;
  avatar?: string | null;
  bio?: string | null;
  age?: number | null;
  location?: string | null;
  school?: string | null;
  interests?: Interest[];
}

export const usersService = {
  async getMe(): Promise<CurrentUser> {
    const response = await apiClient.get<CurrentUser>('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<CurrentUser> {
    const response = await apiClient.patch<CurrentUser>('/users/me', data);
    return response.data;
  },

  async getUserById(userId: string): Promise<User & { isOnline: boolean }> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  async getUserEvents(userId: string): Promise<{ events: Event[] }> {
    const response = await apiClient.get(`/users/${userId}/events`);
    return response.data;
  },

  async searchUsers(query: string): Promise<SearchUser[]> {
    const response = await apiClient.get<SearchUser[]>('/users/search', {
      params: { q: query },
    });
    return response.data;
  },
};
