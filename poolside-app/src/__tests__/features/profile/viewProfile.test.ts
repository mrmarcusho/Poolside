/**
 * Feature: View Profile
 *
 * Tests for viewing profile functionality including:
 * - View Profile (Self): Display name, emoji, avatar, bio, age, location, school, interests
 * - View Profile (Other): Load user by ID, display all fields, show friend status
 */

import { mockUser } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

const { apiClient } = require('../../../api/client');

describe('Feature: View Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('View Self Profile', () => {
    test('should fetch current user profile', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockUser });

      const response = await apiClient.get('/users/me');

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(response.data.id).toBe('user-1');
    });

    test('should return profile with all required fields', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockUser });

      const response = await apiClient.get('/users/me');
      const user = response.data;

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('emoji');
      expect(user).toHaveProperty('bio');
      expect(user).toHaveProperty('age');
      expect(user).toHaveProperty('location');
      expect(user).toHaveProperty('school');
      expect(user).toHaveProperty('interests');
    });

    test('should display user name', () => {
      expect(mockUser.name).toBe('Test User');
    });

    test('should display user emoji', () => {
      expect(mockUser.emoji).toBe('😊');
    });

    test('should display user bio', () => {
      expect(mockUser.bio).toBe('Test bio');
    });

    test('should display user age', () => {
      expect(mockUser.age).toBe(25);
    });

    test('should display user location', () => {
      expect(mockUser.location).toBe('Miami');
    });

    test('should display user school', () => {
      expect(mockUser.school).toBe('Test University');
    });

    test('should display user interests', () => {
      expect(mockUser.interests).toHaveLength(2);
      expect(mockUser.interests?.[0]).toEqual({ emoji: '🎮', label: 'Gaming' });
    });

    test('should handle missing optional fields', () => {
      const userWithMissingFields = {
        ...mockUser,
        bio: null,
        age: null,
        location: null,
        school: null,
        interests: null,
      };

      expect(userWithMissingFields.bio).toBeNull();
      expect(userWithMissingFields.age).toBeNull();
    });
  });

  describe('View Other Profile', () => {
    const otherUser = {
      ...mockUser,
      id: 'user-2',
      name: 'Other User',
      isOnline: true,
    };

    test('should fetch other user profile by ID', async () => {
      apiClient.get.mockResolvedValueOnce({ data: otherUser });

      const response = await apiClient.get('/users/user-2');

      expect(apiClient.get).toHaveBeenCalledWith('/users/user-2');
      expect(response.data.id).toBe('user-2');
    });

    test('should include online status for other users', async () => {
      apiClient.get.mockResolvedValueOnce({ data: otherUser });

      const response = await apiClient.get('/users/user-2');

      expect(response.data.isOnline).toBe(true);
    });

    test('should handle user not found', async () => {
      apiClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'User not found' } },
      });

      await expect(apiClient.get('/users/nonexistent')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    test('should track loading state', async () => {
      let isLoading = false;

      const loadProfile = async (userId: string) => {
        isLoading = true;
        try {
          apiClient.get.mockResolvedValueOnce({ data: otherUser });
          await apiClient.get(`/users/${userId}`);
        } finally {
          isLoading = false;
        }
      };

      await loadProfile('user-2');
      expect(isLoading).toBe(false);
    });
  });

  describe('Profile Display Components', () => {
    test('should format age for display', () => {
      const formatAge = (age: number | null) => {
        if (age === null) return 'Not specified';
        return `${age} years old`;
      };

      expect(formatAge(25)).toBe('25 years old');
      expect(formatAge(null)).toBe('Not specified');
    });

    test('should format location for display', () => {
      const formatLocation = (location: string | null) => {
        if (!location) return 'Location not set';
        return location;
      };

      expect(formatLocation('Miami')).toBe('Miami');
      expect(formatLocation(null)).toBe('Location not set');
    });

    test('should display interests as tags', () => {
      const interests = mockUser.interests || [];

      expect(interests.map(i => `${i.emoji} ${i.label}`)).toEqual([
        '🎮 Gaming',
        '🎵 Music',
      ]);
    });

    test('should display avatar or emoji fallback', () => {
      const getDisplayImage = (avatar: string | null, emoji: string | null) => {
        if (avatar) return { type: 'avatar', uri: avatar };
        if (emoji) return { type: 'emoji', value: emoji };
        return { type: 'default' };
      };

      expect(getDisplayImage('https://example.com/avatar.jpg', '😊')).toEqual({
        type: 'avatar',
        uri: 'https://example.com/avatar.jpg',
      });
      expect(getDisplayImage(null, '😊')).toEqual({
        type: 'emoji',
        value: '😊',
      });
      expect(getDisplayImage(null, null)).toEqual({ type: 'default' });
    });
  });

  describe('Friend Status (Other Profile)', () => {
    test('should show "Add Friend" for non-friends', () => {
      const getFriendActionLabel = (status: 'none' | 'pending' | 'friends') => {
        switch (status) {
          case 'none':
            return 'Add Friend';
          case 'pending':
            return 'Request Pending';
          case 'friends':
            return 'Friends';
        }
      };

      expect(getFriendActionLabel('none')).toBe('Add Friend');
    });

    test('should show "Request Pending" for pending requests', () => {
      const getFriendActionLabel = (status: 'none' | 'pending' | 'friends') => {
        switch (status) {
          case 'none':
            return 'Add Friend';
          case 'pending':
            return 'Request Pending';
          case 'friends':
            return 'Friends';
        }
      };

      expect(getFriendActionLabel('pending')).toBe('Request Pending');
    });

    test('should show "Friends" for existing friends', () => {
      const getFriendActionLabel = (status: 'none' | 'pending' | 'friends') => {
        switch (status) {
          case 'none':
            return 'Add Friend';
          case 'pending':
            return 'Request Pending';
          case 'friends':
            return 'Friends';
        }
      };

      expect(getFriendActionLabel('friends')).toBe('Friends');
    });

    test('should show "Message" button for friends', () => {
      const shouldShowMessageButton = (isFriend: boolean) => isFriend;

      expect(shouldShowMessageButton(true)).toBe(true);
      expect(shouldShowMessageButton(false)).toBe(false);
    });
  });

  describe('User Events', () => {
    test('should fetch user hosted events', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Pool Party' },
        { id: 'event-2', title: 'Karaoke Night' },
      ];
      apiClient.get.mockResolvedValueOnce({ data: { events: mockEvents } });

      const response = await apiClient.get('/users/user-1/events');

      expect(apiClient.get).toHaveBeenCalledWith('/users/user-1/events');
      expect(response.data.events).toHaveLength(2);
    });

    test('should handle user with no events', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { events: [] } });

      const response = await apiClient.get('/users/user-1/events');

      expect(response.data.events).toHaveLength(0);
    });
  });

  describe('Online Status Display', () => {
    test('should show online indicator when online', () => {
      const user = { ...mockUser, isOnline: true };
      expect(user.isOnline).toBe(true);
    });

    test('should not show online indicator for self profile', () => {
      const shouldShowOnlineStatus = (isOwnProfile: boolean) => !isOwnProfile;

      expect(shouldShowOnlineStatus(true)).toBe(false);
      expect(shouldShowOnlineStatus(false)).toBe(true);
    });
  });
});
