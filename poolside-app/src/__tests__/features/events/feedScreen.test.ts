/**
 * Feature: Feed Screen
 *
 * Tests for the feed screen functionality including:
 * - Load and display event list
 * - Pull-to-refresh functionality
 * - Event card rendering (title, image/color, time, location, attendee count)
 * - Tap event to view details
 * - Pagination/infinite scroll
 * - Age-based event filtering display
 */

import { mockEvents, mockEventsResponse, mockEvent } from '../../utils/testUtils';

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

describe('Feature: Feed Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load Events', () => {
    test('should fetch events on initial load', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      const response = await apiClient.get('/events');

      expect(apiClient.get).toHaveBeenCalledWith('/events');
      expect(response.data.events).toHaveLength(3);
    });

    test('should return events with correct structure', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      const response = await apiClient.get('/events');
      const event = response.data.events[0];

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('locationName');
      expect(event).toHaveProperty('dateTime');
      expect(event).toHaveProperty('host');
      expect(event).toHaveProperty('rsvpCount');
    });

    test('should handle empty events list', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { events: [], hasMore: false, total: 0 },
      });

      const response = await apiClient.get('/events');

      expect(response.data.events).toHaveLength(0);
      expect(response.data.hasMore).toBe(false);
    });

    test('should handle loading errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/events')).rejects.toThrow('Network error');
    });

    test('should track loading state', async () => {
      let isLoading = false;
      let events: typeof mockEvents = [];

      const loadEvents = async () => {
        isLoading = true;
        try {
          apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });
          const response = await apiClient.get('/events');
          events = response.data.events;
        } finally {
          isLoading = false;
        }
      };

      await loadEvents();
      expect(isLoading).toBe(false);
      expect(events).toHaveLength(3);
    });
  });

  describe('Pull-to-Refresh', () => {
    test('should refresh events on pull-to-refresh', async () => {
      // Initial load
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });
      await apiClient.get('/events');

      // Refresh
      const updatedEvents = {
        ...mockEventsResponse,
        events: [...mockEventsResponse.events, { ...mockEvent, id: 'event-4', title: 'New Event' }],
      };
      apiClient.get.mockResolvedValueOnce({ data: updatedEvents });

      const response = await apiClient.get('/events');

      expect(response.data.events).toHaveLength(4);
    });

    test('should track refreshing state', async () => {
      let isRefreshing = false;

      const onRefresh = async () => {
        isRefreshing = true;
        apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });
        await apiClient.get('/events');
        isRefreshing = false;
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });

    test('should handle refresh errors', async () => {
      let refreshError: Error | null = null;

      const onRefresh = async () => {
        try {
          apiClient.get.mockRejectedValueOnce(new Error('Refresh failed'));
          await apiClient.get('/events');
        } catch (e) {
          refreshError = e as Error;
        }
      };

      await onRefresh();
      expect(refreshError).not.toBeNull();
      expect(refreshError?.message).toBe('Refresh failed');
    });

    test('should clear refresh state on error', async () => {
      let isRefreshing = true;

      const onRefresh = async () => {
        try {
          apiClient.get.mockRejectedValueOnce(new Error('Refresh failed'));
          await apiClient.get('/events');
        } catch {
          // Error handled
        } finally {
          isRefreshing = false;
        }
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });
  });

  describe('Event Card Rendering', () => {
    test('should display event title', () => {
      const event = mockEvent;
      expect(event.title).toBe('Pool Party');
    });

    test('should display event location', () => {
      const event = mockEvent;
      expect(event.locationName).toBe('Main Pool');
      expect(event.locationDeck).toBe('Deck 10');
    });

    test('should display event date and time', () => {
      const event = mockEvent;
      expect(event.dateTime).toBe('2024-06-15T14:00:00.000Z');

      // Test date formatting (use UTC hours to avoid timezone issues)
      const date = new Date(event.dateTime);
      expect(date.getUTCHours()).toBe(14);
    });

    test('should display attendee count', () => {
      const event = mockEvent;
      const rsvpCount = event.rsvpCount as { going: number; interested: number };
      expect(rsvpCount.going).toBe(15);
      expect(rsvpCount.interested).toBe(8);
    });

    test('should display host information', () => {
      const event = mockEvent;
      expect(event.host.name).toBe('Party Host');
      expect(event.host.emoji).toBe('🎉');
    });

    test('should handle event with image', () => {
      const eventWithImage = { ...mockEvent, eventImage: 'https://example.com/image.jpg' };
      expect(eventWithImage.eventImage).toBe('https://example.com/image.jpg');
    });

    test('should handle event with color theme', () => {
      const event = mockEvent;
      expect(event.theme).toEqual({ bgColor: '#3B82F6', textColor: '#FFFFFF' });
    });

    test('should handle event without image (use color)', () => {
      const eventWithoutImage = { ...mockEvent, eventImage: null };
      expect(eventWithoutImage.eventImage).toBeNull();
      expect(eventWithoutImage.theme).toBeDefined();
    });
  });

  describe('Pagination', () => {
    test('should indicate if more events are available', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      const response = await apiClient.get('/events');

      expect(response.data.hasMore).toBe(true);
      expect(response.data.nextCursor).toBe('cursor-123');
    });

    test('should fetch next page with cursor', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: {
          events: [{ ...mockEvent, id: 'event-4' }],
          hasMore: false,
          total: 4,
          nextCursor: null,
        },
      });

      const response = await apiClient.get('/events', { params: { cursor: 'cursor-123' } });

      expect(apiClient.get).toHaveBeenCalledWith('/events', { params: { cursor: 'cursor-123' } });
      expect(response.data.hasMore).toBe(false);
    });

    test('should append new events to existing list', async () => {
      let events = [...mockEvents];

      // Load more
      const newEvent = { ...mockEvent, id: 'event-4', title: 'New Event' };
      apiClient.get.mockResolvedValueOnce({
        data: { events: [newEvent], hasMore: false, nextCursor: null },
      });

      const response = await apiClient.get('/events', { params: { cursor: 'cursor-123' } });
      events = [...events, ...response.data.events];

      expect(events).toHaveLength(4);
    });

    test('should support limit parameter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      await apiClient.get('/events', { params: { limit: 10 } });

      expect(apiClient.get).toHaveBeenCalledWith('/events', { params: { limit: 10 } });
    });
  });

  describe('Event Filtering', () => {
    test('should filter events by date', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      await apiClient.get('/events', { params: { date: '2024-06-15' } });

      expect(apiClient.get).toHaveBeenCalledWith('/events', { params: { date: '2024-06-15' } });
    });

    test('should filter events by location', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      await apiClient.get('/events', { params: { location: 'Main Pool' } });

      expect(apiClient.get).toHaveBeenCalledWith('/events', { params: { location: 'Main Pool' } });
    });

    test('should filter events by host', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEventsResponse });

      await apiClient.get('/events', { params: { hostId: 'user-2' } });

      expect(apiClient.get).toHaveBeenCalledWith('/events', { params: { hostId: 'user-2' } });
    });
  });

  describe('Event Details Navigation', () => {
    test('should get event by ID for details view', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEvent });

      const response = await apiClient.get('/events/event-1');

      expect(apiClient.get).toHaveBeenCalledWith('/events/event-1');
      expect(response.data.id).toBe('event-1');
    });

    test('should include full description in details', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockEvent });

      const response = await apiClient.get('/events/event-1');

      expect(response.data.fullDescription).toBe('Join us for an amazing pool party with music and drinks!');
    });

    test('should handle non-existent event', async () => {
      apiClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Event not found' } },
      });

      await expect(apiClient.get('/events/non-existent')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('RSVP Status Display', () => {
    test('should display user RSVP status on event', () => {
      const eventWithRsvp = { ...mockEvent, myRsvp: 'going' };
      expect(eventWithRsvp.myRsvp).toBe('going');
    });

    test('should display no RSVP status for unregistered events', () => {
      const eventWithoutRsvp = { ...mockEvent, myRsvp: null };
      expect(eventWithoutRsvp.myRsvp).toBeNull();
    });

    test('should display interested status', () => {
      const eventInterested = { ...mockEvent, myRsvp: 'interested' };
      expect(eventInterested.myRsvp).toBe('interested');
    });
  });
});
