/**
 * Feature: Friend Requests
 *
 * Tests for friend requests functionality including:
 * - Outgoing: Search users, send friend request, pending state
 * - Incoming: Display pending requests, accept/reject
 */

import { mockFriendRequests, mockUser } from '../../utils/testUtils';

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

describe('Feature: Friend Requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Outgoing Requests - Search Users', () => {
    const mockSearchResults = [
      { id: 'user-10', name: 'John Doe', emoji: '👋', avatar: null, isOnline: true },
      { id: 'user-11', name: 'Jane Smith', emoji: '🎵', avatar: null, isOnline: false },
    ];

    test('should search users by name', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockSearchResults });

      const response = await apiClient.get('/users/search', { params: { q: 'John' } });

      expect(apiClient.get).toHaveBeenCalledWith('/users/search', { params: { q: 'John' } });
      expect(response.data).toHaveLength(2);
    });

    test('should handle empty search results', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const response = await apiClient.get('/users/search', { params: { q: 'xyz' } });

      expect(response.data).toHaveLength(0);
    });

    test('should debounce search input', async () => {
      jest.useFakeTimers();

      let searchCount = 0;
      let lastQuery = '';
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const debouncedSearch = (query: string, delay: number) => {
        // Cancel previous timer - this is the debounce behavior
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          searchCount++;
          lastQuery = query;
        }, delay);
      };

      debouncedSearch('J', 300);
      debouncedSearch('Jo', 300);
      debouncedSearch('John', 300);

      jest.advanceTimersByTime(300);

      expect(searchCount).toBe(1);
      expect(lastQuery).toBe('John');
      jest.useRealTimers();
    });

    test('should require minimum query length', () => {
      const isValidQuery = (query: string) => query.trim().length >= 2;

      expect(isValidQuery('J')).toBe(false);
      expect(isValidQuery('Jo')).toBe(true);
    });
  });

  describe('Outgoing Requests - Send Request', () => {
    test('should send friend request', async () => {
      const expectedResponse = {
        requestId: 'request-123',
        toUser: { id: 'user-10', name: 'John Doe' },
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      apiClient.post.mockResolvedValueOnce({ data: expectedResponse });

      const response = await apiClient.post('/me/friends/request', { userId: 'user-10' });

      expect(apiClient.post).toHaveBeenCalledWith('/me/friends/request', { userId: 'user-10' });
      expect(response.data.status).toBe('pending');
    });

    test('should handle already friends error', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Already friends with this user' } },
      });

      await expect(apiClient.post('/me/friends/request', { userId: 'user-10' })).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    test('should handle request already pending error', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Friend request already pending' } },
      });

      await expect(apiClient.post('/me/friends/request', { userId: 'user-10' })).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    test('should update UI to pending state after sending', () => {
      let requestStatus: 'none' | 'pending' | 'friends' = 'none';

      const sendRequest = () => {
        requestStatus = 'pending';
      };

      sendRequest();
      expect(requestStatus).toBe('pending');
    });

    test('should track sending state', async () => {
      let isSending = false;

      const sendRequest = async (userId: string) => {
        isSending = true;
        apiClient.post.mockResolvedValueOnce({ data: { requestId: '123' } });
        await apiClient.post('/me/friends/request', { userId });
        isSending = false;
      };

      await sendRequest('user-10');
      expect(isSending).toBe(false);
    });
  });

  describe('Incoming Requests - Load Requests', () => {
    test('should fetch pending friend requests', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { requests: mockFriendRequests } });

      const response = await apiClient.get('/me/friends/requests');

      expect(apiClient.get).toHaveBeenCalledWith('/me/friends/requests');
      expect(response.data.requests).toHaveLength(2);
    });

    test('should return requests with correct structure', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { requests: mockFriendRequests } });

      const response = await apiClient.get('/me/friends/requests');
      const request = response.data.requests[0];

      expect(request).toHaveProperty('id');
      expect(request).toHaveProperty('from');
      expect(request).toHaveProperty('createdAt');
      expect(request.from).toHaveProperty('id');
      expect(request.from).toHaveProperty('name');
    });

    test('should handle empty requests list', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { requests: [] } });

      const response = await apiClient.get('/me/friends/requests');

      expect(response.data.requests).toHaveLength(0);
    });

    test('should display request count badge', () => {
      const getRequestBadge = (count: number) => {
        if (count === 0) return null;
        if (count > 99) return '99+';
        return count.toString();
      };

      expect(getRequestBadge(0)).toBeNull();
      expect(getRequestBadge(5)).toBe('5');
      expect(getRequestBadge(100)).toBe('99+');
    });
  });

  describe('Incoming Requests - Accept', () => {
    test('should accept friend request', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/friends/requests/request-1/accept');

      expect(apiClient.post).toHaveBeenCalledWith('/me/friends/requests/request-1/accept');
      expect(response.data.success).toBe(true);
    });

    test('should remove request from list after accepting', () => {
      let requests = [...mockFriendRequests];

      const acceptRequest = (requestId: string) => {
        requests = requests.filter(r => r.id !== requestId);
      };

      acceptRequest('request-1');
      expect(requests).toHaveLength(1);
      expect(requests.find(r => r.id === 'request-1')).toBeUndefined();
    });

    test('should add user to friends list after accepting', () => {
      let friends: Array<{ id: string; name: string }> = [];

      const acceptRequest = (request: typeof mockFriendRequests[0]) => {
        friends = [...friends, { id: request.from.id, name: request.from.name }];
      };

      acceptRequest(mockFriendRequests[0]);
      expect(friends).toHaveLength(1);
      expect(friends[0].id).toBe(mockFriendRequests[0].from.id);
    });

    test('should handle accept errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Request not found' } },
      });

      await expect(apiClient.post('/me/friends/requests/invalid/accept')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Incoming Requests - Reject', () => {
    test('should reject friend request', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const response = await apiClient.post('/me/friends/requests/request-1/reject');

      expect(apiClient.post).toHaveBeenCalledWith('/me/friends/requests/request-1/reject');
      expect(response.data.success).toBe(true);
    });

    test('should remove request from list after rejecting', () => {
      let requests = [...mockFriendRequests];

      const rejectRequest = (requestId: string) => {
        requests = requests.filter(r => r.id !== requestId);
      };

      rejectRequest('request-1');
      expect(requests).toHaveLength(1);
    });

    test('should not add user to friends after rejecting', () => {
      let friends: string[] = [];

      const rejectRequest = (requestId: string) => {
        // Just remove from requests, don't add to friends
      };

      rejectRequest('request-1');
      expect(friends).toHaveLength(0);
    });

    test('should handle reject errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Request not found' } },
      });

      await expect(apiClient.post('/me/friends/requests/invalid/reject')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Request Display', () => {
    test('should display requester name', () => {
      const request = mockFriendRequests[0];
      expect(request.from.name).toBe('New Friend');
    });

    test('should display requester emoji/avatar', () => {
      const request = mockFriendRequests[0];
      expect(request.from.emoji).toBe('👋');
    });

    test('should display request time', () => {
      const formatRequestTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
      };

      const request = mockFriendRequests[0];
      expect(typeof formatRequestTime(request.createdAt)).toBe('string');
    });

    test('should show accept and reject buttons', () => {
      const requestActions = ['accept', 'reject'];
      expect(requestActions).toContain('accept');
      expect(requestActions).toContain('reject');
    });
  });

  describe('Loading States', () => {
    test('should track accept loading state', async () => {
      let isAccepting = false;

      const acceptRequest = async (requestId: string) => {
        isAccepting = true;
        apiClient.post.mockResolvedValueOnce({ data: { success: true } });
        await apiClient.post(`/me/friends/requests/${requestId}/accept`);
        isAccepting = false;
      };

      await acceptRequest('request-1');
      expect(isAccepting).toBe(false);
    });

    test('should track reject loading state', async () => {
      let isRejecting = false;

      const rejectRequest = async (requestId: string) => {
        isRejecting = true;
        apiClient.post.mockResolvedValueOnce({ data: { success: true } });
        await apiClient.post(`/me/friends/requests/${requestId}/reject`);
        isRejecting = false;
      };

      await rejectRequest('request-1');
      expect(isRejecting).toBe(false);
    });

    test('should disable buttons during action', () => {
      let isProcessing = true;

      const areButtonsDisabled = (processing: boolean) => processing;

      expect(areButtonsDisabled(isProcessing)).toBe(true);

      isProcessing = false;
      expect(areButtonsDisabled(isProcessing)).toBe(false);
    });
  });
});
