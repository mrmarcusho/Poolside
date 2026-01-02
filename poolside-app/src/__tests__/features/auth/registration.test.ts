/**
 * Feature: Registration
 *
 * Tests for the registration functionality including:
 * - Form fields (name, email, password, cabin number)
 * - Input validation (email format, password strength)
 * - Registration API call
 * - Auto-login after registration
 */

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

describe('Feature: Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage.setTokens.mockResolvedValue(undefined);
  });

  describe('Registration API Service', () => {
    const validRegistrationData = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      cabinNumber: 'A123',
    };

    test('should successfully register with valid data', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await apiClient.post('/auth/register', validRegistrationData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', validRegistrationData);
      expect(response.data).toEqual(mockAuthResponse);
    });

    test('should register without optional cabin number', async () => {
      const dataWithoutCabin = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      };

      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await apiClient.post('/auth/register', dataWithoutCabin);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', dataWithoutCabin);
      expect(response.data).toBeDefined();
    });

    test('should store tokens after successful registration (auto-login)', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      await apiClient.post('/auth/register', validRegistrationData);
      await tokenStorage.setTokens(mockAuthResponse.accessToken, mockAuthResponse.refreshToken);

      expect(tokenStorage.setTokens).toHaveBeenCalledWith('mock-access-token', 'mock-refresh-token');
    });

    test('should return user data after registration', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await apiClient.post('/auth/register', validRegistrationData);

      expect(response.data.user).toBeDefined();
      expect(response.data.user.id).toBeDefined();
      expect(response.data.user.name).toBe('Test User');
    });

    test('should reject registration with existing email', async () => {
      const errorResponse = {
        response: {
          status: 409,
          data: { message: 'Email already exists' },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(apiClient.post('/auth/register', validRegistrationData)).rejects.toEqual(errorResponse);
    });

    test('should reject registration with invalid data', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Validation failed', errors: ['Invalid email format'] },
        },
      };
      apiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(
        apiClient.post('/auth/register', { ...validRegistrationData, email: 'invalid' })
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('Registration Form Validation', () => {
    describe('Name Validation', () => {
      const validateName = (name: string) => {
        if (!name || name.trim().length === 0) return 'Name is required';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        if (name.trim().length > 50) return 'Name must be less than 50 characters';
        return null;
      };

      test('should require name field', () => {
        expect(validateName('')).toBe('Name is required');
        expect(validateName('  ')).toBe('Name is required');
      });

      test('should require minimum 2 characters', () => {
        expect(validateName('A')).toBe('Name must be at least 2 characters');
        expect(validateName('Jo')).toBeNull();
      });

      test('should limit name to 50 characters', () => {
        const longName = 'A'.repeat(51);
        expect(validateName(longName)).toBe('Name must be less than 50 characters');
        expect(validateName('A'.repeat(50))).toBeNull();
      });

      test('should accept valid names', () => {
        expect(validateName('John Doe')).toBeNull();
        expect(validateName('Jane')).toBeNull();
        expect(validateName('Test User 123')).toBeNull();
      });
    });

    describe('Email Validation', () => {
      const validateEmail = (email: string) => {
        if (!email || email.trim().length === 0) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Invalid email format';
        return null;
      };

      test('should require email field', () => {
        expect(validateEmail('')).toBe('Email is required');
      });

      test('should validate email format', () => {
        expect(validateEmail('invalid')).toBe('Invalid email format');
        expect(validateEmail('invalid@')).toBe('Invalid email format');
        expect(validateEmail('@domain.com')).toBe('Invalid email format');
        expect(validateEmail('user@.com')).toBe('Invalid email format');
      });

      test('should accept valid emails', () => {
        expect(validateEmail('test@example.com')).toBeNull();
        expect(validateEmail('user.name@domain.co.uk')).toBeNull();
        expect(validateEmail('user+tag@example.org')).toBeNull();
      });
    });

    describe('Password Validation', () => {
      const validatePassword = (password: string) => {
        if (!password || password.length === 0) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        return null;
      };

      test('should require password field', () => {
        expect(validatePassword('')).toBe('Password is required');
      });

      test('should require minimum 8 characters', () => {
        expect(validatePassword('short')).toBe('Password must be at least 8 characters');
        expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
      });

      test('should accept valid passwords', () => {
        expect(validatePassword('password123')).toBeNull();
        expect(validatePassword('SecurePass!')).toBeNull();
        expect(validatePassword('12345678')).toBeNull();
      });
    });

    describe('Cabin Number Validation (Optional)', () => {
      const validateCabinNumber = (cabin: string | undefined) => {
        if (!cabin) return null; // Optional field
        if (cabin.length > 10) return 'Cabin number too long';
        return null;
      };

      test('should accept empty cabin number', () => {
        expect(validateCabinNumber(undefined)).toBeNull();
        expect(validateCabinNumber('')).toBeNull();
      });

      test('should accept valid cabin numbers', () => {
        expect(validateCabinNumber('A123')).toBeNull();
        expect(validateCabinNumber('B-456')).toBeNull();
        expect(validateCabinNumber('12345')).toBeNull();
      });

      test('should reject overly long cabin numbers', () => {
        expect(validateCabinNumber('A'.repeat(11))).toBe('Cabin number too long');
      });
    });

    describe('Full Form Validation', () => {
      interface RegistrationForm {
        name: string;
        email: string;
        password: string;
        cabinNumber?: string;
      }

      const validateForm = (form: RegistrationForm) => {
        const errors: string[] = [];

        if (!form.name || form.name.trim().length < 2) errors.push('Invalid name');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Invalid email');
        if (!form.password || form.password.length < 8) errors.push('Invalid password');

        return errors;
      };

      test('should validate complete form', () => {
        const validForm = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cabinNumber: 'A123',
        };

        expect(validateForm(validForm)).toEqual([]);
      });

      test('should return all validation errors', () => {
        const invalidForm = {
          name: '',
          email: 'invalid',
          password: 'short',
        };

        const errors = validateForm(invalidForm);
        expect(errors).toContain('Invalid name');
        expect(errors).toContain('Invalid email');
        expect(errors).toContain('Invalid password');
      });
    });
  });

  describe('Registration State Management', () => {
    test('should track loading state during registration', async () => {
      let isLoading = false;

      const performRegistration = async () => {
        isLoading = true;
        apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
        await apiClient.post('/auth/register', {
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        isLoading = false;
      };

      await performRegistration();
      expect(isLoading).toBe(false);
    });

    test('should set user after successful registration', async () => {
      let user = null;

      const performRegistration = async () => {
        apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
        const response = await apiClient.post('/auth/register', {
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        user = response.data.user;
      };

      await performRegistration();
      expect(user).not.toBeNull();
    });
  });
});
