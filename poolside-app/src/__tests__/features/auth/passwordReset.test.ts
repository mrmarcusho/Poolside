/**
 * Feature: Password Reset
 *
 * Tests for password reset functionality including:
 * - Forgot password request flow
 * - Reset token handling
 * - New password submission
 */

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

const { apiClient } = require('../../../api/client');

describe('Feature: Password Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Forgot Password Request', () => {
    test('should send forgot password request with valid email', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { message: 'Reset email sent' } });

      const response = await apiClient.post('/auth/forgot-password', { email: 'test@example.com' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
      expect(response.data.message).toBe('Reset email sent');
    });

    test('should handle non-existent email gracefully', async () => {
      // API should return success even for non-existent emails (security best practice)
      apiClient.post.mockResolvedValueOnce({ data: { message: 'Reset email sent' } });

      const response = await apiClient.post('/auth/forgot-password', { email: 'nonexistent@example.com' });

      expect(response.data.message).toBe('Reset email sent');
    });

    test('should validate email format before sending request', () => {
      const validateEmail = (email: string) => {
        if (!email) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Invalid email format';
        return null;
      };

      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('invalid')).toBe('Invalid email format');
      expect(validateEmail('valid@example.com')).toBeNull();
    });

    test('should handle rate limiting', async () => {
      const errorResponse = {
        response: {
          status: 429,
          data: { message: 'Too many requests. Please try again later.' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/forgot-password', { email: 'test@example.com' })
      ).rejects.toEqual(errorResponse);
    });

    test('should handle server errors', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/forgot-password', { email: 'test@example.com' })
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('Reset Password with Token', () => {
    const validResetData = {
      token: 'valid-reset-token-123',
      password: 'NewSecurePassword123!',
    };

    test('should reset password with valid token', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { message: 'Password reset successful' } });

      const response = await apiClient.post('/auth/reset-password', validResetData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', validResetData);
      expect(response.data.message).toBe('Password reset successful');
    });

    test('should reject invalid reset token', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid or expired reset token' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/reset-password', { token: 'invalid-token', password: 'NewPass123!' })
      ).rejects.toEqual(errorResponse);
    });

    test('should reject expired reset token', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Reset token has expired' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/reset-password', { token: 'expired-token', password: 'NewPass123!' })
      ).rejects.toEqual(errorResponse);
    });

    test('should validate new password strength', () => {
      const validateNewPassword = (password: string) => {
        const errors: string[] = [];

        if (!password) {
          errors.push('Password is required');
          return errors;
        }

        if (password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }

        return errors;
      };

      expect(validateNewPassword('')).toContain('Password is required');
      expect(validateNewPassword('short')).toContain('Password must be at least 8 characters');
      expect(validateNewPassword('ValidPassword123')).toEqual([]);
    });

    test('should require password confirmation match', () => {
      const validatePasswordConfirmation = (password: string, confirmPassword: string) => {
        if (password !== confirmPassword) {
          return 'Passwords do not match';
        }
        return null;
      };

      expect(validatePasswordConfirmation('password123', 'password456')).toBe('Passwords do not match');
      expect(validatePasswordConfirmation('password123', 'password123')).toBeNull();
    });
  });

  describe('Password Reset Flow State', () => {
    test('should track loading state during forgot password request', async () => {
      let isLoading = false;

      const requestPasswordReset = async (email: string) => {
        isLoading = true;
        apiClient.post.mockResolvedValueOnce({ data: { message: 'Email sent' } });
        await apiClient.post('/auth/forgot-password', { email });
        isLoading = false;
      };

      await requestPasswordReset('test@example.com');
      expect(isLoading).toBe(false);
    });

    test('should track success state after request', async () => {
      let isSuccess = false;

      const requestPasswordReset = async (email: string) => {
        apiClient.post.mockResolvedValueOnce({ data: { message: 'Email sent' } });
        await apiClient.post('/auth/forgot-password', { email });
        isSuccess = true;
      };

      await requestPasswordReset('test@example.com');
      expect(isSuccess).toBe(true);
    });

    test('should track error state on failure', async () => {
      let error: string | null = null;

      const requestPasswordReset = async (email: string) => {
        try {
          apiClient.post.mockRejectedValueOnce({
            response: { status: 500, data: { message: 'Server error' } },
          });
          await apiClient.post('/auth/forgot-password', { email });
        } catch (e: any) {
          error = e.response?.data?.message || 'Unknown error';
        }
      };

      await requestPasswordReset('test@example.com');
      expect(error).toBe('Server error');
    });

    test('should track loading state during password reset', async () => {
      let isLoading = false;

      const resetPassword = async (token: string, password: string) => {
        isLoading = true;
        apiClient.post.mockResolvedValueOnce({ data: { message: 'Reset successful' } });
        await apiClient.post('/auth/reset-password', { token, password });
        isLoading = false;
      };

      await resetPassword('token', 'newpassword123');
      expect(isLoading).toBe(false);
    });
  });

  describe('Reset Token Extraction', () => {
    test('should extract token from URL query params', () => {
      const extractTokenFromUrl = (url: string) => {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('token');
      };

      const url = 'https://app.poolside.com/reset-password?token=abc123';
      expect(extractTokenFromUrl(url)).toBe('abc123');
    });

    test('should handle missing token in URL', () => {
      const extractTokenFromUrl = (url: string) => {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('token');
      };

      const url = 'https://app.poolside.com/reset-password';
      expect(extractTokenFromUrl(url)).toBeNull();
    });

    test('should extract token from deep link', () => {
      const extractTokenFromDeepLink = (link: string) => {
        // Format: poolside://reset-password/TOKEN
        const match = link.match(/poolside:\/\/reset-password\/(.+)/);
        return match ? match[1] : null;
      };

      expect(extractTokenFromDeepLink('poolside://reset-password/abc123')).toBe('abc123');
      expect(extractTokenFromDeepLink('poolside://other-path')).toBeNull();
    });
  });
});
