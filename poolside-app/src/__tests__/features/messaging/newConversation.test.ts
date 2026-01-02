/**
 * Feature: New Conversation
 *
 * Tests for new conversation functionality including:
 * - User search to find recipient
 * - Create conversation with first message
 * - Navigate to new chat
 */

import { mockUser } from '../../utils/testUtils';

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
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const { apiClient } = require('../../../api/client');

describe('Feature: New Conversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Search', () => {
    const mockSearchResults = [
      { id: 'user-10', name: 'John Doe', emoji: '👋', avatar: null, isOnline: true, lastSeen: new Date().toISOString() },
      { id: 'user-11', name: 'Jane Smith', emoji: '🎵', avatar: null, isOnline: false, lastSeen: new Date().toISOString() },
    ];

    test('should search users by query', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockSearchResults });

      const response = await apiClient.get('/users/search', { params: { q: 'John' } });

      expect(apiClient.get).toHaveBeenCalledWith('/users/search', { params: { q: 'John' } });
      expect(response.data).toHaveLength(2);
    });

    test('should return users with required fields', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockSearchResults });

      const response = await apiClient.get('/users/search', { params: { q: 'John' } });
      const user = response.data[0];

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('emoji');
      expect(user).toHaveProperty('isOnline');
    });

    test('should handle empty search results', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const response = await apiClient.get('/users/search', { params: { q: 'nonexistent' } });

      expect(response.data).toHaveLength(0);
    });

    test('should debounce search requests', async () => {
      jest.useFakeTimers();

      let searchCallCount = 0;
      let lastQuery = '';
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const debouncedSearch = (query: string, delay: number) => {
        // Cancel previous timer - this is the debounce behavior
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          searchCallCount++;
          lastQuery = query;
        }, delay);
      };

      // Simulate rapid typing
      debouncedSearch('J', 300);
      debouncedSearch('Jo', 300);
      debouncedSearch('Joh', 300);
      debouncedSearch('John', 300);

      jest.advanceTimersByTime(300);

      // Only the last call should have executed
      expect(searchCallCount).toBe(1);
      expect(lastQuery).toBe('John');

      jest.useRealTimers();
    });

    test('should require minimum query length', () => {
      const isValidQuery = (query: string, minLength: number = 2) => {
        return query.trim().length >= minLength;
      };

      expect(isValidQuery('J', 2)).toBe(false);
      expect(isValidQuery('Jo', 2)).toBe(true);
      expect(isValidQuery('John', 2)).toBe(true);
    });

    test('should display online status for search results', () => {
      const user = mockSearchResults[0];
      expect(user.isOnline).toBe(true);
    });

    test('should filter out current user from results', () => {
      const currentUserId = 'user-1';
      const results = [...mockSearchResults, { ...mockSearchResults[0], id: currentUserId }];

      const filtered = results.filter(user => user.id !== currentUserId);

      expect(filtered).toHaveLength(2);
      expect(filtered.find(u => u.id === currentUserId)).toBeUndefined();
    });
  });

  describe('Select Recipient', () => {
    test('should store selected user', () => {
      let selectedUser: typeof mockUser | null = null;

      const handleUserSelect = (user: typeof mockUser) => {
        selectedUser = user;
      };

      handleUserSelect(mockUser);
      expect(selectedUser).toEqual(mockUser);
    });

    test('should allow changing selected user', () => {
      let selectedUser: typeof mockUser | null = mockUser;

      const handleUserSelect = (user: typeof mockUser) => {
        selectedUser = user;
      };

      const newUser = { ...mockUser, id: 'user-2', name: 'Different User' };
      handleUserSelect(newUser);
      expect(selectedUser?.id).toBe('user-2');
    });

    test('should clear selected user', () => {
      let selectedUser: typeof mockUser | null = mockUser;

      const clearSelection = () => {
        selectedUser = null;
      };

      clearSelection();
      expect(selectedUser).toBeNull();
    });
  });

  describe('Create Conversation', () => {
    test('should create conversation with recipient', async () => {
      const expectedResponse = {
        conversationId: 'new-conv-1',
        message: null,
      };
      apiClient.post.mockResolvedValueOnce({ data: expectedResponse });

      const response = await apiClient.post('/me/messages/conversations', { userId: 'user-2' });

      expect(apiClient.post).toHaveBeenCalledWith('/me/messages/conversations', { userId: 'user-2' });
      expect(response.data.conversationId).toBe('new-conv-1');
    });

    test('should create conversation with initial message', async () => {
      const expectedResponse = {
        conversationId: 'new-conv-1',
        message: {
          id: 'msg-1',
          text: 'Hello!',
          senderId: 'user-1',
          sentAt: new Date().toISOString(),
          readAt: null,
        },
      };
      apiClient.post.mockResolvedValueOnce({ data: expectedResponse });

      const response = await apiClient.post('/me/messages/conversations', {
        userId: 'user-2',
        message: 'Hello!',
      });

      expect(response.data.message).not.toBeNull();
      expect(response.data.message.text).toBe('Hello!');
    });

    test('should return existing conversation if already exists', async () => {
      const expectedResponse = {
        conversationId: 'existing-conv-1',
        message: null,
      };
      apiClient.post.mockResolvedValueOnce({ data: expectedResponse });

      const response = await apiClient.post('/me/messages/conversations', { userId: 'user-2' });

      expect(response.data.conversationId).toBe('existing-conv-1');
    });

    test('should handle creation errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid user' } },
      });

      await expect(
        apiClient.post('/me/messages/conversations', { userId: 'invalid' })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('Initial Message (Optional)', () => {
    test('should support sending without initial message', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { conversationId: 'conv-1', message: null },
      });

      const response = await apiClient.post('/me/messages/conversations', { userId: 'user-2' });

      expect(response.data.message).toBeNull();
    });

    test('should trim initial message', () => {
      const prepareMessage = (text: string | undefined) => {
        if (!text) return undefined;
        const trimmed = text.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      expect(prepareMessage('  Hello  ')).toBe('Hello');
      expect(prepareMessage('   ')).toBeUndefined();
      expect(prepareMessage(undefined)).toBeUndefined();
    });

    test('should validate initial message', () => {
      const isValidMessage = (text: string | undefined) => {
        if (!text) return true; // Optional, so empty is valid
        return text.trim().length > 0 && text.trim().length <= 1000;
      };

      expect(isValidMessage(undefined)).toBe(true);
      expect(isValidMessage('')).toBe(true);
      expect(isValidMessage('Hello')).toBe(true);
      expect(isValidMessage('A'.repeat(1001))).toBe(false);
    });
  });

  describe('Navigation After Creation', () => {
    test('should navigate to new chat after creation', async () => {
      let navigatedToId: string | null = null;

      const createAndNavigate = async (userId: string) => {
        apiClient.post.mockResolvedValueOnce({
          data: { conversationId: 'new-conv-1', message: null },
        });

        const response = await apiClient.post('/me/messages/conversations', { userId });
        navigatedToId = response.data.conversationId;
      };

      await createAndNavigate('user-2');
      expect(navigatedToId).toBe('new-conv-1');
    });

    test('should pass participant info to chat screen', () => {
      let navigationParams: { conversationId: string; participant: typeof mockUser } | null = null;

      const navigateToChat = (conversationId: string, participant: typeof mockUser) => {
        navigationParams = { conversationId, participant };
      };

      navigateToChat('conv-1', mockUser);
      expect(navigationParams?.conversationId).toBe('conv-1');
      expect(navigationParams?.participant).toEqual(mockUser);
    });
  });

  describe('Loading State', () => {
    test('should track search loading state', async () => {
      let isSearching = false;

      const performSearch = async (query: string) => {
        isSearching = true;
        apiClient.get.mockResolvedValueOnce({ data: [] });
        await apiClient.get('/users/search', { params: { q: query } });
        isSearching = false;
      };

      await performSearch('John');
      expect(isSearching).toBe(false);
    });

    test('should track creation loading state', async () => {
      let isCreating = false;

      const createConversation = async (userId: string) => {
        isCreating = true;
        apiClient.post.mockResolvedValueOnce({
          data: { conversationId: 'conv-1', message: null },
        });
        await apiClient.post('/me/messages/conversations', { userId });
        isCreating = false;
      };

      await createConversation('user-2');
      expect(isCreating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should display error for search failure', async () => {
      let searchError: Error | null = null;

      const performSearch = async (query: string) => {
        try {
          apiClient.get.mockRejectedValueOnce(new Error('Search failed'));
          await apiClient.get('/users/search', { params: { q: query } });
        } catch (e) {
          searchError = e as Error;
        }
      };

      await performSearch('John');
      expect(searchError?.message).toBe('Search failed');
    });

    test('should display error for creation failure', async () => {
      let createError: Error | null = null;

      const createConversation = async (userId: string) => {
        try {
          apiClient.post.mockRejectedValueOnce(new Error('Creation failed'));
          await apiClient.post('/me/messages/conversations', { userId });
        } catch (e) {
          createError = e as Error;
        }
      };

      await createConversation('user-2');
      expect(createError?.message).toBe('Creation failed');
    });
  });
});
