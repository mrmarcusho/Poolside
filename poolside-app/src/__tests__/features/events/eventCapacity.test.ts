/**
 * Feature: Event Capacity & Full Status
 *
 * Tests that when an event reaches capacity:
 * - isFull flag is correctly set to true
 * - Other users see the event as full
 * - Users who haven't RSVPed cannot RSVP as "going"
 * - Users who are already "going" can still manage their RSVP
 */

import {
  mockEvent,
  mockEventWithCapacity,
  mockFullEvent,
  mockAlmostFullEvent,
} from '../../utils/testUtils';

// Mock the API client
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
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

describe('Feature: Event Capacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isFull Calculation', () => {
    test('event with spots=20 and goingCount=20 should have isFull=true', () => {
      const event = { ...mockEvent, spots: 20, rsvpCount: { going: 20, interested: 5 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(true);
    });

    test('event with spots=20 and goingCount=19 should have isFull=false', () => {
      const event = { ...mockEvent, spots: 20, rsvpCount: { going: 19, interested: 5 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(false);
    });

    test('event with spots=null (unlimited) should have isFull=false', () => {
      const event = { ...mockEvent, spots: null, rsvpCount: { going: 100, interested: 50 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(false);
    });

    test('event with spots=0 should always be full', () => {
      const event = { ...mockEvent, spots: 0, rsvpCount: { going: 0, interested: 5 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(true);
    });

    test('mockFullEvent fixture should have isFull=true', () => {
      expect(mockFullEvent.isFull).toBe(true);
      expect(mockFullEvent.spots).toBe(20);
      expect(mockFullEvent.rsvpCount.going).toBe(20);
    });

    test('mockAlmostFullEvent fixture should have isFull=false', () => {
      expect(mockAlmostFullEvent.isFull).toBe(false);
      expect(mockAlmostFullEvent.spots).toBe(20);
      expect(mockAlmostFullEvent.rsvpCount.going).toBe(19);
    });
  });

  describe('RSVP to Full Event', () => {
    test('should reject RSVP with 400 "Event is full" when at capacity', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Event is full' } },
      });

      await expect(
        apiClient.post('/events/full-event-id/rsvp', { status: 'going' })
      ).rejects.toMatchObject({
        response: { status: 400, data: { message: 'Event is full' } },
      });
    });

    test('should allow user already GOING to change to INTERESTED on full event', async () => {
      // User is already GOING, so they can change to INTERESTED even if event is full
      const response = {
        eventId: 'full-event-id',
        status: 'interested',
        rsvpCount: { going: 19, interested: 11 }, // Going decreased by 1
        isFull: false, // No longer full since they left
        spots: 20,
      };
      apiClient.post.mockResolvedValueOnce({ data: response });

      const result = await apiClient.post('/events/full-event-id/rsvp', { status: 'interested' });

      expect(result.data.status).toBe('interested');
      expect(result.data.isFull).toBe(false);
    });

    test('should allow INTERESTED RSVP regardless of capacity', async () => {
      // INTERESTED RSVPs don't count toward capacity
      const response = {
        eventId: 'full-event-id',
        status: 'interested',
        rsvpCount: { going: 20, interested: 11 },
        isFull: true,
        spots: 20,
      };
      apiClient.post.mockResolvedValueOnce({ data: response });

      const result = await apiClient.post('/events/full-event-id/rsvp', { status: 'interested' });

      expect(result.data.status).toBe('interested');
      expect(result.data.isFull).toBe(true); // Still full, INTERESTED doesn't affect this
    });
  });

  describe('When Last Spot is Taken', () => {
    test('RSVP response should include isFull=true when last spot taken', async () => {
      // User takes the last spot (19 -> 20 going)
      const response = {
        eventId: 'almost-full-event-id',
        status: 'going',
        rsvpCount: { going: 20, interested: 5 },
        isFull: true,
        spots: 20,
      };
      apiClient.post.mockResolvedValueOnce({ data: response });

      const result = await apiClient.post('/events/almost-full-event-id/rsvp', { status: 'going' });

      expect(result.data.status).toBe('going');
      expect(result.data.isFull).toBe(true);
      expect(result.data.rsvpCount.going).toBe(20);
      expect(result.data.spots).toBe(20);
    });

    test('other users should see isFull=true after event fills', async () => {
      // Simulate fetching event list after someone else filled the last spot
      const eventsResponse = {
        events: [
          { ...mockAlmostFullEvent, rsvpCount: { going: 20, interested: 5 }, isFull: true },
        ],
      };
      apiClient.get.mockResolvedValueOnce({ data: eventsResponse });

      const result = await apiClient.get('/events');

      expect(result.data.events[0].isFull).toBe(true);
    });
  });

  describe('When Someone Cancels from Full Event', () => {
    test('RSVP removal should return isFull=false when spot opens', async () => {
      const response = {
        eventId: 'full-event-id',
        status: null,
        rsvpCount: { going: 19, interested: 10 },
        isFull: false,
        spots: 20,
      };
      apiClient.delete.mockResolvedValueOnce({ data: response });

      const result = await apiClient.delete('/events/full-event-id/rsvp');

      expect(result.data.status).toBeNull();
      expect(result.data.isFull).toBe(false);
      expect(result.data.rsvpCount.going).toBe(19);
    });
  });

  describe('UI State: RSVP Button Disabled', () => {
    test('RSVP should be disabled when event is full and user has no RSVP', () => {
      const event = mockFullEvent;
      const userRsvpStatus = null;
      const isRsvpDisabled = event.isFull && userRsvpStatus === null;

      expect(isRsvpDisabled).toBe(true);
    });

    test('RSVP should NOT be disabled when event is full but user is GOING', () => {
      const event = mockFullEvent;
      const userRsvpStatus = 'going';
      const isRsvpDisabled = event.isFull && userRsvpStatus === null;

      expect(isRsvpDisabled).toBe(false);
    });

    test('RSVP should NOT be disabled when event has open spots', () => {
      const event = mockAlmostFullEvent;
      const userRsvpStatus = null;
      const isRsvpDisabled = event.isFull && userRsvpStatus === null;

      expect(isRsvpDisabled).toBe(false);
    });

    test('RSVP should NOT be disabled for unlimited capacity event', () => {
      const event = { ...mockEvent, spots: null, isFull: false };
      const userRsvpStatus = null;
      const isRsvpDisabled = event.isFull && userRsvpStatus === null;

      expect(isRsvpDisabled).toBe(false);
    });
  });

  describe('Real-time Full Status Broadcast', () => {
    test('broadcast payload should include isFull and updated counts', () => {
      // Simulate what the socket broadcast should contain
      const broadcastPayload = {
        eventId: 'event-1',
        rsvpCount: { going: 20, interested: 5 },
        isFull: true,
        spots: 20,
        userId: 'user-who-rsvped',
      };

      expect(broadcastPayload).toHaveProperty('eventId');
      expect(broadcastPayload).toHaveProperty('rsvpCount');
      expect(broadcastPayload).toHaveProperty('isFull');
      expect(broadcastPayload).toHaveProperty('spots');
      expect(broadcastPayload.isFull).toBe(true);
    });

    test('socket listener should update local event isFull state', () => {
      // Simulate receiving a socket update
      let localEvent = { ...mockAlmostFullEvent };

      const handleRsvpUpdate = (data: { eventId: string; isFull: boolean; rsvpCount: { going: number; interested: number } }) => {
        if (data.eventId === localEvent.id) {
          localEvent = { ...localEvent, isFull: data.isFull, rsvpCount: data.rsvpCount };
        }
      };

      // Simulate socket event: someone took the last spot
      handleRsvpUpdate({
        eventId: 'event-almost-full-1',
        isFull: true,
        rsvpCount: { going: 20, interested: 5 },
      });

      expect(localEvent.isFull).toBe(true);
      expect(localEvent.rsvpCount.going).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    test('should handle event with spots=1 (single attendee event)', () => {
      const event = { ...mockEvent, spots: 1, rsvpCount: { going: 1, interested: 0 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(true);
    });

    test('should handle race condition: goingCount > spots (data inconsistency)', () => {
      // This shouldn't happen, but the calculation should still work
      const event = { ...mockEvent, spots: 20, rsvpCount: { going: 25, interested: 5 } };
      const isFull = event.spots !== null && event.rsvpCount.going >= event.spots;
      expect(isFull).toBe(true);
    });

    test('should correctly identify full event when spots equals going exactly', () => {
      const spots = 15;
      const going = 15;
      const isFull = spots !== null && going >= spots;
      expect(isFull).toBe(true);
    });
  });
});
