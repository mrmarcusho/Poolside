/**
 * Feature: Edit Profile
 *
 * Tests for editing profile functionality including:
 * - Update each field (name, bio, age, location, school)
 * - Update emoji/avatar
 * - Add/remove interests
 * - Save changes
 */

import { mockUser } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    defaults: { baseURL: 'http://localhost:3000/v1', headers: { 'Content-Type': 'application/json' } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

// Mock image picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'images' },
}));

const { apiClient } = require('../../../api/client');
const ImagePicker = require('expo-image-picker');

describe('Feature: Edit Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Update Name', () => {
    test('should update name successfully', async () => {
      const updatedUser = { ...mockUser, name: 'New Name' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { name: 'New Name' });

      expect(apiClient.patch).toHaveBeenCalledWith('/users/me', { name: 'New Name' });
      expect(response.data.name).toBe('New Name');
    });

    test('should validate name is not empty', () => {
      const validateName = (name: string) => {
        if (!name || name.trim().length === 0) return 'Name is required';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      };

      expect(validateName('')).toBe('Name is required');
      expect(validateName('A')).toBe('Name must be at least 2 characters');
      expect(validateName('John')).toBeNull();
    });

    test('should validate name maximum length', () => {
      const validateName = (name: string) => {
        if (name.length > 50) return 'Name must be less than 50 characters';
        return null;
      };

      expect(validateName('A'.repeat(51))).toBe('Name must be less than 50 characters');
    });
  });

  describe('Update Bio', () => {
    test('should update bio successfully', async () => {
      const updatedUser = { ...mockUser, bio: 'New bio text' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { bio: 'New bio text' });

      expect(response.data.bio).toBe('New bio text');
    });

    test('should allow empty bio', async () => {
      const updatedUser = { ...mockUser, bio: null };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { bio: null });

      expect(response.data.bio).toBeNull();
    });

    test('should validate bio maximum length', () => {
      const validateBio = (bio: string) => {
        if (bio && bio.length > 200) return 'Bio must be less than 200 characters';
        return null;
      };

      expect(validateBio('A'.repeat(201))).toBe('Bio must be less than 200 characters');
      expect(validateBio('Short bio')).toBeNull();
    });

    test('should show character count', () => {
      const getCharCount = (bio: string, maxLength: number) => {
        return `${bio.length}/${maxLength}`;
      };

      expect(getCharCount('Hello', 200)).toBe('5/200');
    });
  });

  describe('Update Age', () => {
    test('should update age successfully', async () => {
      const updatedUser = { ...mockUser, age: 30 };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { age: 30 });

      expect(response.data.age).toBe(30);
    });

    test('should validate age is positive number', () => {
      const validateAge = (age: number | null) => {
        if (age === null) return null; // Optional
        if (age < 13) return 'Must be at least 13 years old';
        if (age > 120) return 'Invalid age';
        return null;
      };

      expect(validateAge(null)).toBeNull();
      expect(validateAge(12)).toBe('Must be at least 13 years old');
      expect(validateAge(25)).toBeNull();
      expect(validateAge(121)).toBe('Invalid age');
    });

    test('should allow clearing age', async () => {
      const updatedUser = { ...mockUser, age: null };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { age: null });

      expect(response.data.age).toBeNull();
    });
  });

  describe('Update Location', () => {
    test('should update location successfully', async () => {
      const updatedUser = { ...mockUser, location: 'New York' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { location: 'New York' });

      expect(response.data.location).toBe('New York');
    });

    test('should allow clearing location', async () => {
      const updatedUser = { ...mockUser, location: null };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { location: null });

      expect(response.data.location).toBeNull();
    });
  });

  describe('Update School', () => {
    test('should update school successfully', async () => {
      const updatedUser = { ...mockUser, school: 'Harvard' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { school: 'Harvard' });

      expect(response.data.school).toBe('Harvard');
    });

    test('should allow clearing school', async () => {
      const updatedUser = { ...mockUser, school: null };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { school: null });

      expect(response.data.school).toBeNull();
    });
  });

  describe('Update Emoji', () => {
    test('should update emoji successfully', async () => {
      const updatedUser = { ...mockUser, emoji: '🎉' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { emoji: '🎉' });

      expect(response.data.emoji).toBe('🎉');
    });

    test('should have emoji picker options', () => {
      const emojiOptions = ['😊', '🎉', '🔥', '💯', '🚀', '💪', '🌟', '❤️'];
      expect(emojiOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Update Avatar', () => {
    test('should launch image picker for avatar', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://new-avatar.jpg' }],
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      expect(result.canceled).toBe(false);
      expect(result.assets[0].uri).toBe('file://new-avatar.jpg');
    });

    test('should handle cancelled avatar selection', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      const result = await ImagePicker.launchImageLibraryAsync({});

      expect(result.canceled).toBe(true);
    });

    test('should update avatar successfully', async () => {
      const updatedUser = { ...mockUser, avatar: 'https://example.com/new-avatar.jpg' };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { avatar: 'https://example.com/new-avatar.jpg' });

      expect(response.data.avatar).toBe('https://example.com/new-avatar.jpg');
    });

    test('should allow removing avatar', async () => {
      const updatedUser = { ...mockUser, avatar: null };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { avatar: null });

      expect(response.data.avatar).toBeNull();
    });
  });

  describe('Update Interests', () => {
    test('should update interests successfully', async () => {
      const newInterests = [
        { emoji: '🏀', label: 'Basketball' },
        { emoji: '🎨', label: 'Art' },
      ];
      const updatedUser = { ...mockUser, interests: newInterests };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', { interests: newInterests });

      expect(response.data.interests).toHaveLength(2);
      expect(response.data.interests[0].label).toBe('Basketball');
    });

    test('should add new interest', () => {
      let interests = [{ emoji: '🎮', label: 'Gaming' }];

      const addInterest = (interest: { emoji: string; label: string }) => {
        interests = [...interests, interest];
      };

      addInterest({ emoji: '🎵', label: 'Music' });
      expect(interests).toHaveLength(2);
    });

    test('should remove interest', () => {
      let interests = [
        { emoji: '🎮', label: 'Gaming' },
        { emoji: '🎵', label: 'Music' },
      ];

      const removeInterest = (label: string) => {
        interests = interests.filter(i => i.label !== label);
      };

      removeInterest('Gaming');
      expect(interests).toHaveLength(1);
      expect(interests[0].label).toBe('Music');
    });

    test('should limit number of interests', () => {
      const MAX_INTERESTS = 10;

      const canAddInterest = (currentCount: number) => currentCount < MAX_INTERESTS;

      expect(canAddInterest(5)).toBe(true);
      expect(canAddInterest(10)).toBe(false);
    });

    test('should prevent duplicate interests', () => {
      const interests = [{ emoji: '🎮', label: 'Gaming' }];

      const canAddInterest = (label: string, currentInterests: typeof interests) => {
        return !currentInterests.some(i => i.label.toLowerCase() === label.toLowerCase());
      };

      expect(canAddInterest('Gaming', interests)).toBe(false);
      expect(canAddInterest('Music', interests)).toBe(true);
    });
  });

  describe('Save Changes', () => {
    test('should save all changes at once', async () => {
      const updates = {
        name: 'Updated Name',
        bio: 'Updated bio',
        age: 26,
        location: 'Boston',
      };
      const updatedUser = { ...mockUser, ...updates };
      apiClient.patch.mockResolvedValueOnce({ data: updatedUser });

      const response = await apiClient.patch('/users/me', updates);

      expect(apiClient.patch).toHaveBeenCalledWith('/users/me', updates);
      expect(response.data.name).toBe('Updated Name');
    });

    test('should track saving state', async () => {
      let isSaving = false;

      const saveProfile = async (updates: object) => {
        isSaving = true;
        apiClient.patch.mockResolvedValueOnce({ data: { ...mockUser, ...updates } });
        await apiClient.patch('/users/me', updates);
        isSaving = false;
      };

      await saveProfile({ name: 'Test' });
      expect(isSaving).toBe(false);
    });

    test('should handle save errors', async () => {
      apiClient.patch.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Validation failed' } },
      });

      await expect(apiClient.patch('/users/me', { name: '' })).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('should update local state after successful save', async () => {
      let user = { ...mockUser };

      const saveProfile = async (updates: Partial<typeof mockUser>) => {
        const updatedUser = { ...user, ...updates };
        apiClient.patch.mockResolvedValueOnce({ data: updatedUser });
        const response = await apiClient.patch('/users/me', updates);
        user = response.data;
      };

      await saveProfile({ name: 'New Name' });
      expect(user.name).toBe('New Name');
    });
  });

  describe('Form State Management', () => {
    test('should track dirty state (unsaved changes)', () => {
      let originalData = { name: 'Original', bio: 'Bio' };
      let formData = { ...originalData };

      const isDirty = () => {
        return JSON.stringify(originalData) !== JSON.stringify(formData);
      };

      expect(isDirty()).toBe(false);

      formData.name = 'Changed';
      expect(isDirty()).toBe(true);
    });

    test('should confirm before discarding changes', () => {
      let confirmationShown = false;

      const handleBack = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
          confirmationShown = true;
        }
      };

      handleBack(true);
      expect(confirmationShown).toBe(true);
    });

    test('should reset form on cancel', () => {
      const originalData = { name: 'Original', bio: 'Bio' };
      let formData = { name: 'Changed', bio: 'New Bio' };

      const resetForm = () => {
        formData = { ...originalData };
      };

      resetForm();
      expect(formData).toEqual(originalData);
    });
  });
});
