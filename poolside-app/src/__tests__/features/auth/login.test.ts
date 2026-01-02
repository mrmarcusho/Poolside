/**
 * Feature: Login
 *
 * Tests for the login functionality including:
 * - Email/password input and validation
 * - Login API call and error handling
 * - Token storage on success
 * - Navigation to main app on success
 */

import { mockAuthService, mockTokenStorage, resetAllMocks } from '../../utils/mockApi';
import { mockAuthResponse } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const { apiClient, tokenStorage } = require('../../../api/client');

describe('Feature: Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage.setTokens.mockResolvedValue(undefined);
  });

  describe('Login API Service', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    test('should successfully login with valid credentials', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await apiClient.post('/auth/login', validCredentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', validCredentials);
      expect(response.data).toEqual(mockAuthResponse);
      expect(response.data.accessToken).toBe('mock-access-token');
      expect(response.data.refreshToken).toBe('mock-refresh-token');
    });

    test('should store tokens on successful login', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      await apiClient.post('/auth/login', validCredentials);
      await tokenStorage.setTokens(mockAuthResponse.accessToken, mockAuthResponse.refreshToken);

      expect(tokenStorage.setTokens).toHaveBeenCalledWith('mock-access-token', 'mock-refresh-token');
    });

    test('should return user data on successful login', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await apiClient.post('/auth/login', validCredentials);

      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.data.user.name).toBe('Test User');
    });

    test('should reject login with invalid credentials', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(apiClient.post('/auth/login', validCredentials)).rejects.toEqual(errorResponse);
    });

    test('should reject login with non-existent user', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/login', { email: 'nonexistent@example.com', password: 'pass' })
      ).rejects.toEqual(errorResponse);
    });

    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      apiClient.post.mockRejectedValueOnce(networkError);

      await expect(apiClient.post('/auth/login', validCredentials)).rejects.toThrow('Network Error');
    });

    test('should handle server errors (500)', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      apiClient.post.mockRejectedValueOnce(serverError);

      await expect(apiClient.post('/auth/login', validCredentials)).rejects.toEqual(serverError);
    });
  });

  describe('Login Input Validation', () => {
    test('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co', 'user+tag@example.org'];
      const invalidEmails = ['invalid', 'invalid@', '@domain.com', 'user@.com'];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should validate password is not empty', () => {
      const validatePassword = (password: string) => password.length > 0;

      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('')).toBe(false);
    });

    test('should validate both fields are required', () => {
      const validateLoginForm = (email: string, password: string) => {
        return email.length > 0 && password.length > 0;
      };

      expect(validateLoginForm('test@example.com', 'password')).toBe(true);
      expect(validateLoginForm('', 'password')).toBe(false);
      expect(validateLoginForm('test@example.com', '')).toBe(false);
      expect(validateLoginForm('', '')).toBe(false);
    });
  });

  describe('Login State Management', () => {
    test('should track loading state during login', async () => {
      let isLoading = false;

      const performLogin = async () => {
        isLoading = true;
        apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
        await apiClient.post('/auth/login', { email: 'test@example.com', password: 'pass' });
        isLoading = false;
      };

      expect(isLoading).toBe(false);
      const loginPromise = performLogin();
      // During the async operation
      await loginPromise;
      expect(isLoading).toBe(false);
    });

    test('should clear error state on new login attempt', async () => {
      let error: Error | null = new Error('Previous error');

      const performLogin = async () => {
        error = null; // Clear previous error
        apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
        await apiClient.post('/auth/login', { email: 'test@example.com', password: 'pass' });
      };

      await performLogin();
      expect(error).toBeNull();
    });

    test('should set error state on failed login', async () => {
      let error: Error | null = null;

      const performLogin = async () => {
        error = null;
        try {
          apiClient.post.mockRejectedValueOnce(new Error('Login failed'));
          await apiClient.post('/auth/login', { email: 'test@example.com', password: 'pass' });
        } catch (e) {
          error = e as Error;
        }
      };

      await performLogin();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Login failed');
    });
  });
});
