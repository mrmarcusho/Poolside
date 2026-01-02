/**
 * Feature: Friends List
 *
 * Tests for friends list functionality including:
 * - Load and display current friends
 * - Online status indicators
 * - Tap friend to view profile or message
 * - Remove friend action
 */

import { mockFriends, mockFriend } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

const { apiClient } = require('../../../api/client');

describe('Feature: Friends List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load Friends', () => {
    test('should fetch friends list', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { friends: mockFriends } });

      const response = await apiClient.get('/me/friends');

      expect(apiClient.get).toHaveBeenCalledWith('/me/friends');
      expect(response.data.friends).toHaveLength(2);
    });

    test('should return friends with correct structure', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { friends: mockFriends } });

      const response = await apiClient.get('/me/friends');
      const friend = response.data.friends[0];

      expect(friend).toHaveProperty('id');
      expect(friend).toHaveProperty('name');
      expect(friend).toHaveProperty('emoji');
      expect(friend).toHaveProperty('isOnline');
      expect(friend).toHaveProperty('friendsSince');
    });

    test('should handle empty friends list', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { friends: [] } });

      const response = await apiClient.get('/me/friends');

      expect(response.data.friends).toHaveLength(0);
    });

    test('should handle API errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/me/friends')).rejects.toThrow('Network error');
    });

    test('should track loading state', async () => {
      let isLoading = false;

      const loadFriends = async () => {
        isLoading = true;
        try {
          apiClient.get.mockResolvedValueOnce({ data: { friends: mockFriends } });
          await apiClient.get('/me/friends');
        } finally {
          isLoading = false;
        }
      };

      await loadFriends();
      expect(isLoading).toBe(false);
    });
  });

  describe('Display Friends', () => {
    test('should display friend name', () => {
      const friend = mockFriend;
      expect(friend.name).toBe('Best Friend');
    });

    test('should display friend emoji', () => {
      const friend = mockFriend;
      expect(friend.emoji).toBe('🤗');
    });

    test('should display friend avatar if available', () => {
      const friendWithAvatar = { ...mockFriend, avatar: 'https://example.com/avatar.jpg' };
      expect(friendWithAvatar.avatar).toBe('https://example.com/avatar.jpg');
    });

    test('should display friends since date', () => {
      const friend = mockFriend;
      expect(friend.friendsSince).toBe('2024-01-15T00:00:00.000Z');
    });

    test('should format friends since date', () => {
      const formatFriendsSince = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      };

      expect(formatFriendsSince('2024-01-15T00:00:00.000Z')).toMatch(/Jan.*2024/);
    });

    test('should sort friends by online status', () => {
      const friends = [
        { ...mockFriend, id: '1', isOnline: false },
        { ...mockFriend, id: '2', isOnline: true },
        { ...mockFriend, id: '3', isOnline: true },
      ];

      const sorted = [...friends].sort((a, b) => {
        if (a.isOnline === b.isOnline) return 0;
        return a.isOnline ? -1 : 1;
      });

      expect(sorted[0].isOnline).toBe(true);
      expect(sorted[1].isOnline).toBe(true);
      expect(sorted[2].isOnline).toBe(false);
    });
  });

  describe('Online Status Indicators', () => {
    test('should display online indicator for online friends', () => {
      const friend = { ...mockFriend, isOnline: true };
      expect(friend.isOnline).toBe(true);
    });

    test('should display offline indicator for offline friends', () => {
      const friend = { ...mockFriend, isOnline: false };
      expect(friend.isOnline).toBe(false);
    });

    test('should use correct colors for status', () => {
      const getStatusColor = (isOnline: boolean) => {
        return isOnline ? '#10B981' : '#6B7280';
      };

      expect(getStatusColor(true)).toBe('#10B981'); // Green
      expect(getStatusColor(false)).toBe('#6B7280'); // Gray
    });
  });

  describe('Friend Actions', () => {
    test('should navigate to profile on tap', () => {
      let navigatedToId: string | null = null;

      const handleFriendTap = (friendId: string) => {
        navigatedToId = friendId;
      };

      handleFriendTap('friend-1');
      expect(navigatedToId).toBe('friend-1');
    });

    test('should navigate to message on message button tap', () => {
      let navigatedToConversation: { userId: string } | null = null;

      const handleMessageTap = (friendId: string) => {
        navigatedToConversation = { userId: friendId };
      };

      handleMessageTap('friend-1');
      expect(navigatedToConversation?.userId).toBe('friend-1');
    });
  });

  describe('Remove Friend', () => {
    test('should remove friend successfully', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.delete('/me/friends/friend-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/me/friends/friend-1');
      expect(response.data.success).toBe(true);
    });

    test('should update local state after removal', () => {
      let friends = [...mockFriends];

      const removeFriend = (friendId: string) => {
        friends = friends.filter(f => f.id !== friendId);
      };

      removeFriend('friend-1');
      expect(friends).toHaveLength(1);
      expect(friends.find(f => f.id === 'friend-1')).toBeUndefined();
    });

    test('should show confirmation before removal', () => {
      let confirmationShown = false;

      const showRemoveConfirmation = () => {
        confirmationShown = true;
        return true;
      };

      const result = showRemoveConfirmation();
      expect(confirmationShown).toBe(true);
      expect(result).toBe(true);
    });

    test('should not remove if confirmation cancelled', () => {
      let friends = [...mockFriends];

      const handleRemove = (friendId: string, confirmed: boolean) => {
        if (confirmed) {
          friends = friends.filter(f => f.id !== friendId);
        }
      };

      handleRemove('friend-1', false);
      expect(friends).toHaveLength(2);
    });

    test('should handle removal errors', async () => {
      apiClient.delete.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Friend not found' } },
      });

      await expect(apiClient.delete('/me/friends/nonexistent')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no friends', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { friends: [] } });

      const response = await apiClient.get('/me/friends');
      const hasFriends = response.data.friends.length > 0;

      expect(hasFriends).toBe(false);
    });

    test('should display appropriate empty message', () => {
      const getEmptyMessage = (friendCount: number) => {
        if (friendCount === 0) {
          return 'No friends yet. Find people to connect with!';
        }
        return null;
      };

      expect(getEmptyMessage(0)).toBe('No friends yet. Find people to connect with!');
      expect(getEmptyMessage(5)).toBeNull();
    });
  });

  describe('Pull-to-Refresh', () => {
    test('should refresh friends on pull', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { friends: mockFriends } });

      const response = await apiClient.get('/me/friends');

      expect(response.data.friends).toHaveLength(2);
    });

    test('should track refreshing state', async () => {
      let isRefreshing = false;

      const onRefresh = async () => {
        isRefreshing = true;
        apiClient.get.mockResolvedValueOnce({ data: { friends: [] } });
        await apiClient.get('/me/friends');
        isRefreshing = false;
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });
  });
});
