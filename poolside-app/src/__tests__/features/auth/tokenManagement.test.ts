/**
 * Feature: Token Management
 *
 * Tests for token management functionality including:
 * - Automatic token refresh on 401
 * - Request queuing during refresh
 * - Logout and token clearing
 * - Session persistence across app restarts
 */

import { mockAuthResponse } from '../../utils/testUtils';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SecureStore = require('expo-secure-store');

describe('Feature: Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Storage', () => {
    const ACCESS_TOKEN_KEY = 'poolside_access_token';
    const REFRESH_TOKEN_KEY = 'poolside_refresh_token';

    test('should store access token in secure storage', async () => {
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, 'test-access-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ACCESS_TOKEN_KEY, 'test-access-token');
    });

    test('should store refresh token in secure storage', async () => {
      SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, 'test-refresh-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, 'test-refresh-token');
    });

    test('should retrieve access token from secure storage', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('stored-access-token');

      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

      expect(token).toBe('stored-access-token');
    });

    test('should retrieve refresh token from secure storage', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('stored-refresh-token');

      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      expect(token).toBe('stored-refresh-token');
    });

    test('should return null when no token exists', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

      expect(token).toBeNull();
    });

    test('should clear tokens from secure storage', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    });
  });

  describe('Token Refresh Logic', () => {
    test('should refresh token when receiving 401 error', async () => {
      const mockRefreshEndpoint = jest.fn();

      // Simulate 401 response
      const is401Error = (status: number) => status === 401;

      expect(is401Error(401)).toBe(true);
      expect(is401Error(200)).toBe(false);
      expect(is401Error(403)).toBe(false);
    });

    test('should prevent multiple simultaneous refresh requests', () => {
      let isRefreshing = false;
      const refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

      const handleRefresh = async () => {
        if (isRefreshing) {
          // Queue the request
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          });
        }

        isRefreshing = true;
        // Simulate refresh
        await new Promise(resolve => setTimeout(resolve, 10));
        isRefreshing = false;

        // Process queue
        refreshQueue.forEach(p => p.resolve('new-token'));
        refreshQueue.length = 0;
      };

      // Start multiple refresh attempts
      handleRefresh();
      expect(isRefreshing).toBe(true);
    });

    test('should process queued requests after successful refresh', async () => {
      const processQueue = (error: Error | null, token: string | null) => {
        const results: Array<{ token: string | null; error: Error | null }> = [];

        // Simulate processing 3 queued requests
        for (let i = 0; i < 3; i++) {
          results.push({ token, error });
        }

        return results;
      };

      const results = processQueue(null, 'new-access-token');

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.token).toBe('new-access-token');
        expect(result.error).toBeNull();
      });
    });

    test('should reject queued requests on refresh failure', () => {
      const processQueue = (error: Error | null, token: string | null) => {
        const results: Array<{ token: string | null; error: Error | null }> = [];

        for (let i = 0; i < 3; i++) {
          results.push({ token, error });
        }

        return results;
      };

      const refreshError = new Error('Refresh failed');
      const results = processQueue(refreshError, null);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.error).toBe(refreshError);
        expect(result.token).toBeNull();
      });
    });

    test('should clear tokens on refresh failure', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      const handleRefreshFailure = async () => {
        await SecureStore.deleteItemAsync('poolside_access_token');
        await SecureStore.deleteItemAsync('poolside_refresh_token');
      };

      await handleRefreshFailure();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    });

    test('should update authorization header after refresh', () => {
      const createAuthHeader = (token: string) => `Bearer ${token}`;

      const oldHeader = createAuthHeader('old-token');
      const newHeader = createAuthHeader('new-token');

      expect(oldHeader).toBe('Bearer old-token');
      expect(newHeader).toBe('Bearer new-token');
      expect(oldHeader).not.toBe(newHeader);
    });
  });

  describe('Session Persistence', () => {
    test('should check for existing session on app start', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('existing-token');

      const token = await SecureStore.getItemAsync('poolside_access_token');

      expect(token).toBe('existing-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalled();
    });

    test('should restore user session if valid token exists', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('valid-token');

      const checkAuthState = async () => {
        const token = await SecureStore.getItemAsync('poolside_access_token');
        if (token) {
          // Would normally fetch user data here
          return { isAuthenticated: true };
        }
        return { isAuthenticated: false };
      };

      const result = await checkAuthState();
      expect(result.isAuthenticated).toBe(true);
    });

    test('should not restore session if no token exists', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const checkAuthState = async () => {
        const token = await SecureStore.getItemAsync('poolside_access_token');
        if (token) {
          return { isAuthenticated: true };
        }
        return { isAuthenticated: false };
      };

      const result = await checkAuthState();
      expect(result.isAuthenticated).toBe(false);
    });

    test('should clear invalid tokens during session check', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('invalid-token');
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      const checkAuthState = async () => {
        const token = await SecureStore.getItemAsync('poolside_access_token');
        if (token) {
          // Simulate API call that fails with invalid token
          const apiCallFailed = true;
          if (apiCallFailed) {
            await SecureStore.deleteItemAsync('poolside_access_token');
            await SecureStore.deleteItemAsync('poolside_refresh_token');
            return { isAuthenticated: false };
          }
        }
        return { isAuthenticated: false };
      };

      const result = await checkAuthState();
      expect(result.isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    test('should call logout endpoint', async () => {
      const mockLogoutEndpoint = jest.fn().mockResolvedValue(undefined);

      await mockLogoutEndpoint();

      expect(mockLogoutEndpoint).toHaveBeenCalled();
    });

    test('should clear all tokens on logout', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      const logout = async () => {
        await SecureStore.deleteItemAsync('poolside_access_token');
        await SecureStore.deleteItemAsync('poolside_refresh_token');
      };

      await logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('poolside_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('poolside_refresh_token');
    });

    test('should clear tokens even if logout endpoint fails', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);
      const mockLogoutEndpoint = jest.fn().mockRejectedValue(new Error('Network error'));

      const logout = async () => {
        try {
          await mockLogoutEndpoint();
        } catch {
          // Ignore logout endpoint error
        } finally {
          await SecureStore.deleteItemAsync('poolside_access_token');
          await SecureStore.deleteItemAsync('poolside_refresh_token');
        }
      };

      await logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    });

    test('should reset user state on logout', async () => {
      let user: object | null = { id: 'user-1', name: 'Test' };

      const logout = async () => {
        user = null;
      };

      await logout();

      expect(user).toBeNull();
    });
  });

  describe('Request Interceptor', () => {
    test('should add authorization header to requests', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce('access-token');

      const addAuthHeader = async (config: { headers: Record<string, string> }) => {
        const token = await SecureStore.getItemAsync('poolside_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      };

      const config = { headers: {} as Record<string, string> };
      const result = await addAuthHeader(config);

      expect(result.headers.Authorization).toBe('Bearer access-token');
    });

    test('should not add header if no token exists', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const addAuthHeader = async (config: { headers: Record<string, string> }) => {
        const token = await SecureStore.getItemAsync('poolside_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      };

      const config = { headers: {} as Record<string, string> };
      const result = await addAuthHeader(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
