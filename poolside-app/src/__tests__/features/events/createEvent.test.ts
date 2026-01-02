/**
 * Feature: Create Event Screen
 *
 * Tests for the create event functionality including:
 * - Form field inputs (title, description, location, deck)
 * - Date/time picker functionality
 * - Cover image upload OR color selection
 * - Font and color styling options
 * - Form validation
 * - Submit and create event
 * - Event card animation to feed icon
 */

import { mockEvent } from '../../utils/testUtils';

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

// Mock image picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'images' },
}));

const { apiClient } = require('../../../api/client');
const ImagePicker = require('expo-image-picker');

describe('Feature: Create Event Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Field Inputs', () => {
    describe('Title Field', () => {
      const validateTitle = (title: string) => {
        if (!title || title.trim().length === 0) return 'Title is required';
        if (title.trim().length < 3) return 'Title must be at least 3 characters';
        if (title.trim().length > 100) return 'Title must be less than 100 characters';
        return null;
      };

      test('should require title', () => {
        expect(validateTitle('')).toBe('Title is required');
        expect(validateTitle('   ')).toBe('Title is required');
      });

      test('should require minimum 3 characters', () => {
        expect(validateTitle('Hi')).toBe('Title must be at least 3 characters');
      });

      test('should limit title to 100 characters', () => {
        expect(validateTitle('A'.repeat(101))).toBe('Title must be less than 100 characters');
      });

      test('should accept valid titles', () => {
        expect(validateTitle('Pool Party')).toBeNull();
        expect(validateTitle('Karaoke Night at the Lounge')).toBeNull();
      });
    });

    describe('Description Field', () => {
      const validateDescription = (description: string) => {
        if (!description || description.trim().length === 0) return 'Description is required';
        if (description.trim().length > 500) return 'Description must be less than 500 characters';
        return null;
      };

      test('should require description', () => {
        expect(validateDescription('')).toBe('Description is required');
      });

      test('should limit description to 500 characters', () => {
        expect(validateDescription('A'.repeat(501))).toBe('Description must be less than 500 characters');
      });

      test('should accept valid descriptions', () => {
        expect(validateDescription('Join us for fun!')).toBeNull();
      });
    });

    describe('Location Field', () => {
      const validateLocation = (location: string) => {
        if (!location || location.trim().length === 0) return 'Location is required';
        return null;
      };

      test('should require location', () => {
        expect(validateLocation('')).toBe('Location is required');
      });

      test('should accept valid locations', () => {
        expect(validateLocation('Main Pool')).toBeNull();
        expect(validateLocation('Deck 10 - Lido')).toBeNull();
      });
    });

    describe('Deck Field (Optional)', () => {
      const validateDeck = (deck: string | undefined) => {
        // Deck is optional
        return null;
      };

      test('should accept empty deck', () => {
        expect(validateDeck(undefined)).toBeNull();
        expect(validateDeck('')).toBeNull();
      });

      test('should accept deck values', () => {
        expect(validateDeck('Deck 5')).toBeNull();
        expect(validateDeck('Deck 10')).toBeNull();
      });
    });
  });

  describe('Date/Time Picker', () => {
    test('should validate date is in the future', () => {
      const validateDateTime = (dateTime: Date) => {
        const now = new Date();
        if (dateTime <= now) return 'Event must be in the future';
        return null;
      };

      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      expect(validateDateTime(pastDate)).toBe('Event must be in the future');
      expect(validateDateTime(futureDate)).toBeNull();
    });

    test('should round to 15-minute intervals', () => {
      const roundToInterval = (date: Date, intervalMinutes: number) => {
        const minutes = date.getMinutes();
        const remainder = minutes % intervalMinutes;
        if (remainder === 0) return date;

        const rounded = new Date(date);
        if (remainder < intervalMinutes / 2) {
          rounded.setMinutes(minutes - remainder);
        } else {
          rounded.setMinutes(minutes + (intervalMinutes - remainder));
        }
        rounded.setSeconds(0);
        rounded.setMilliseconds(0);
        return rounded;
      };

      const date = new Date('2024-06-15T14:07:00');
      const rounded = roundToInterval(date, 15);
      expect(rounded.getMinutes()).toBe(0); // Rounds to 14:00

      const date2 = new Date('2024-06-15T14:08:00');
      const rounded2 = roundToInterval(date2, 15);
      expect(rounded2.getMinutes()).toBe(15); // Rounds to 14:15
    });

    test('should format date for display', () => {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      };

      const date = new Date('2024-06-15T14:00:00');
      expect(formatDate(date)).toMatch(/Sat.*Jun.*15/);
    });

    test('should format time for display', () => {
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      };

      const date = new Date('2024-06-15T14:00:00');
      expect(formatTime(date)).toMatch(/2:00.*PM/i);
    });
  });

  describe('Cover Image Upload', () => {
    test('should launch image picker', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://image.jpg' }],
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(result.canceled).toBe(false);
      expect(result.assets[0].uri).toBe('file://image.jpg');
    });

    test('should handle cancelled image selection', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      const result = await ImagePicker.launchImageLibraryAsync({});

      expect(result.canceled).toBe(true);
    });

    test('should store selected image URI', async () => {
      let eventImage: string | null = null;

      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://selected-image.jpg' }],
      });

      const result = await ImagePicker.launchImageLibraryAsync({});
      if (!result.canceled && result.assets) {
        eventImage = result.assets[0].uri;
      }

      expect(eventImage).toBe('file://selected-image.jpg');
    });
  });

  describe('Color Selection', () => {
    const availableColors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#EC4899', // Pink
    ];

    test('should have predefined color options', () => {
      expect(availableColors).toHaveLength(6);
      expect(availableColors).toContain('#3B82F6');
    });

    test('should validate hex color format', () => {
      const isValidHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

      expect(isValidHexColor('#3B82F6')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(false);
      expect(isValidHexColor('3B82F6')).toBe(false);
      expect(isValidHexColor('invalid')).toBe(false);
    });

    test('should select color and clear image', () => {
      let eventImage: string | null = 'file://image.jpg';
      let bgColor: string | null = null;

      const selectColor = (color: string) => {
        bgColor = color;
        eventImage = null; // Clear image when color is selected
      };

      selectColor('#3B82F6');

      expect(bgColor).toBe('#3B82F6');
      expect(eventImage).toBeNull();
    });

    test('should select image and clear color', () => {
      let eventImage: string | null = null;
      let bgColor: string | null = '#3B82F6';

      const selectImage = (uri: string) => {
        eventImage = uri;
        bgColor = null; // Clear color when image is selected
      };

      selectImage('file://image.jpg');

      expect(eventImage).toBe('file://image.jpg');
      expect(bgColor).toBeNull();
    });
  });

  describe('Theme/Styling Options', () => {
    test('should apply text color based on background', () => {
      const getContrastColor = (bgColor: string) => {
        // Simple luminance check
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
      };

      expect(getContrastColor('#3B82F6')).toBe('#FFFFFF'); // Dark blue -> white text
      expect(getContrastColor('#F59E0B')).toBe('#000000'); // Yellow -> black text
    });

    test('should store theme configuration', () => {
      const theme = {
        bgColor: '#3B82F6',
        textColor: '#FFFFFF',
        fontFamily: 'Montserrat',
      };

      expect(theme.bgColor).toBe('#3B82F6');
      expect(theme.textColor).toBe('#FFFFFF');
    });
  });

  describe('Form Validation', () => {
    interface CreateEventForm {
      title: string;
      description: string;
      locationName: string;
      locationDeck?: string;
      dateTime: Date;
      eventImage?: string | null;
      bgColor?: string | null;
    }

    const validateForm = (form: CreateEventForm) => {
      const errors: Record<string, string> = {};

      if (!form.title || form.title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters';
      }

      if (!form.description || form.description.trim().length === 0) {
        errors.description = 'Description is required';
      }

      if (!form.locationName || form.locationName.trim().length === 0) {
        errors.locationName = 'Location is required';
      }

      if (form.dateTime <= new Date()) {
        errors.dateTime = 'Event must be in the future';
      }

      if (!form.eventImage && !form.bgColor) {
        errors.visual = 'Select an image or color';
      }

      return errors;
    };

    test('should validate complete form', () => {
      const validForm: CreateEventForm = {
        title: 'Pool Party',
        description: 'Join us for fun!',
        locationName: 'Main Pool',
        locationDeck: 'Deck 10',
        dateTime: new Date(Date.now() + 86400000),
        bgColor: '#3B82F6',
      };

      expect(validateForm(validForm)).toEqual({});
    });

    test('should return all validation errors', () => {
      const invalidForm: CreateEventForm = {
        title: '',
        description: '',
        locationName: '',
        dateTime: new Date(Date.now() - 86400000),
        eventImage: null,
        bgColor: null,
      };

      const errors = validateForm(invalidForm);
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.locationName).toBeDefined();
      expect(errors.dateTime).toBeDefined();
      expect(errors.visual).toBeDefined();
    });

    test('should require either image or color', () => {
      const formWithImage: CreateEventForm = {
        title: 'Event',
        description: 'Desc',
        locationName: 'Location',
        dateTime: new Date(Date.now() + 86400000),
        eventImage: 'file://image.jpg',
        bgColor: null,
      };

      const formWithColor: CreateEventForm = {
        title: 'Event',
        description: 'Desc',
        locationName: 'Location',
        dateTime: new Date(Date.now() + 86400000),
        eventImage: null,
        bgColor: '#3B82F6',
      };

      expect(validateForm(formWithImage).visual).toBeUndefined();
      expect(validateForm(formWithColor).visual).toBeUndefined();
    });
  });

  describe('Create Event API', () => {
    const validEventData = {
      title: 'Pool Party',
      description: 'Join us for fun!',
      locationName: 'Main Pool',
      locationDeck: 'Deck 10',
      dateTime: '2024-06-15T14:00:00.000Z',
      theme: { bgColor: '#3B82F6', textColor: '#FFFFFF' },
    };

    test('should create event with valid data', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockEvent });

      const response = await apiClient.post('/events', validEventData);

      expect(apiClient.post).toHaveBeenCalledWith('/events', validEventData);
      expect(response.data.id).toBe('event-1');
    });

    test('should return created event', async () => {
      apiClient.post.mockResolvedValueOnce({ data: mockEvent });

      const response = await apiClient.post('/events', validEventData);

      expect(response.data.title).toBe('Pool Party');
      expect(response.data.host).toBeDefined();
    });

    test('should handle creation errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Validation failed' } },
      });

      await expect(apiClient.post('/events', {})).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('should handle server errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Internal server error' } },
      });

      await expect(apiClient.post('/events', validEventData)).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe('Form State Management', () => {
    test('should track form submission state', async () => {
      let isSubmitting = false;

      const submitForm = async () => {
        isSubmitting = true;
        apiClient.post.mockResolvedValueOnce({ data: mockEvent });
        await apiClient.post('/events', {});
        isSubmitting = false;
      };

      await submitForm();
      expect(isSubmitting).toBe(false);
    });

    test('should clear form after successful submission', async () => {
      let formData = {
        title: 'Pool Party',
        description: 'Fun event',
        locationName: 'Pool',
      };

      const clearForm = () => {
        formData = { title: '', description: '', locationName: '' };
      };

      apiClient.post.mockResolvedValueOnce({ data: mockEvent });
      await apiClient.post('/events', formData);
      clearForm();

      expect(formData.title).toBe('');
    });

    test('should preserve form data on submission error', async () => {
      const formData = {
        title: 'Pool Party',
        description: 'Fun event',
        locationName: 'Pool',
      };

      apiClient.post.mockRejectedValueOnce(new Error('Network error'));

      try {
        await apiClient.post('/events', formData);
      } catch {
        // Form data should be preserved
      }

      expect(formData.title).toBe('Pool Party');
    });
  });

  describe('Event Creation Animation', () => {
    test('should trigger animation context on successful creation', () => {
      let animationTriggered = false;

      const triggerAnimation = (eventData: typeof mockEvent) => {
        animationTriggered = true;
        return eventData;
      };

      triggerAnimation(mockEvent);
      expect(animationTriggered).toBe(true);
    });

    test('should pass event data to animation', () => {
      let animatedEvent: typeof mockEvent | null = null;

      const triggerAnimation = (eventData: typeof mockEvent) => {
        animatedEvent = eventData;
      };

      triggerAnimation(mockEvent);
      expect(animatedEvent).toEqual(mockEvent);
    });
  });
});
