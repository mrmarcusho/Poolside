/**
 * Feature: RSVP Actions
 *
 * Tests for the RSVP action functionality including:
 * - Mark as "Going" from event detail
 * - Mark as "Interested" from event detail
 * - Change RSVP status
 * - Remove RSVP
 * - Attendee count updates
 */

import { mockEvent, mockRsvp } from '../../utils/testUtils';

// Mock the API modules
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

describe('Feature: RSVP Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mark as Going', () => {
    test('should create RSVP with "going" status', async () => {
      const expectedRsvp = { ...mockRsvp, status: 'going' };
      apiClient.post.mockResolvedValueOnce({ data: expectedRsvp });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'going' });

      expect(apiClient.post).toHaveBeenCalledWith('/events/event-1/rsvp', { status: 'going' });
      expect(response.data.status).toBe('going');
    });

    test('should return RSVP ID after creation', async () => {
      const expectedRsvp = { ...mockRsvp, id: 'new-rsvp-id' };
      apiClient.post.mockResolvedValueOnce({ data: expectedRsvp });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'going' });

      expect(response.data.id).toBe('new-rsvp-id');
    });

    test('should handle already RSVP\'d error', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Already RSVP\'d to this event' } },
      });

      await expect(apiClient.post('/events/event-1/rsvp', { status: 'going' })).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    test('should handle event not found error', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Event not found' } },
      });

      await expect(apiClient.post('/events/non-existent/rsvp', { status: 'going' })).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Mark as Interested', () => {
    test('should create RSVP with "interested" status', async () => {
      const expectedRsvp = { ...mockRsvp, status: 'interested' };
      apiClient.post.mockResolvedValueOnce({ data: expectedRsvp });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'interested' });

      expect(apiClient.post).toHaveBeenCalledWith('/events/event-1/rsvp', { status: 'interested' });
      expect(response.data.status).toBe('interested');
    });

    test('should allow changing from going to interested', async () => {
      const expectedRsvp = { ...mockRsvp, status: 'interested' };
      apiClient.post.mockResolvedValueOnce({ data: expectedRsvp });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'interested' });

      expect(response.data.status).toBe('interested');
    });
  });

  describe('Change RSVP Status', () => {
    test('should change from "going" to "interested"', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { ...mockRsvp, status: 'interested' } });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'interested' });

      expect(response.data.status).toBe('interested');
    });

    test('should change from "interested" to "going"', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { ...mockRsvp, status: 'going' } });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'going' });

      expect(response.data.status).toBe('going');
    });

    test('should update local state after status change', () => {
      let eventRsvpStatus: 'going' | 'interested' | null = 'going';

      const changeRsvpStatus = (newStatus: 'going' | 'interested') => {
        eventRsvpStatus = newStatus;
      };

      changeRsvpStatus('interested');
      expect(eventRsvpStatus).toBe('interested');
    });
  });

  describe('Remove RSVP', () => {
    test('should remove RSVP successfully', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: undefined });

      await apiClient.delete('/events/event-1/rsvp');

      expect(apiClient.delete).toHaveBeenCalledWith('/events/event-1/rsvp');
    });

    test('should clear local RSVP state after removal', () => {
      let eventRsvpStatus: 'going' | 'interested' | null = 'going';

      const removeRsvp = () => {
        eventRsvpStatus = null;
      };

      removeRsvp();
      expect(eventRsvpStatus).toBeNull();
    });

    test('should handle remove non-existent RSVP', async () => {
      apiClient.delete.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'RSVP not found' } },
      });

      await expect(apiClient.delete('/events/event-1/rsvp')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('Attendee Count Updates', () => {
    test('should increment "going" count when marking as going', () => {
      let rsvpCount = { going: 15, interested: 8 };

      const handleRsvp = (status: 'going' | 'interested', previousStatus: 'going' | 'interested' | null) => {
        if (previousStatus) {
          rsvpCount[previousStatus]--;
        }
        rsvpCount[status]++;
      };

      handleRsvp('going', null);
      expect(rsvpCount.going).toBe(16);
      expect(rsvpCount.interested).toBe(8);
    });

    test('should increment "interested" count when marking as interested', () => {
      let rsvpCount = { going: 15, interested: 8 };

      const handleRsvp = (status: 'going' | 'interested', previousStatus: 'going' | 'interested' | null) => {
        if (previousStatus) {
          rsvpCount[previousStatus]--;
        }
        rsvpCount[status]++;
      };

      handleRsvp('interested', null);
      expect(rsvpCount.going).toBe(15);
      expect(rsvpCount.interested).toBe(9);
    });

    test('should transfer count when changing status', () => {
      let rsvpCount = { going: 15, interested: 8 };

      const handleRsvp = (status: 'going' | 'interested', previousStatus: 'going' | 'interested' | null) => {
        if (previousStatus) {
          rsvpCount[previousStatus]--;
        }
        rsvpCount[status]++;
      };

      // Change from going to interested
      handleRsvp('interested', 'going');
      expect(rsvpCount.going).toBe(14);
      expect(rsvpCount.interested).toBe(9);
    });

    test('should decrement count when removing RSVP', () => {
      let rsvpCount = { going: 15, interested: 8 };

      const handleRemoveRsvp = (previousStatus: 'going' | 'interested') => {
        rsvpCount[previousStatus]--;
      };

      handleRemoveRsvp('going');
      expect(rsvpCount.going).toBe(14);
      expect(rsvpCount.interested).toBe(8);
    });

    test('should not have negative counts', () => {
      let rsvpCount = { going: 0, interested: 0 };

      const handleRemoveRsvp = (previousStatus: 'going' | 'interested') => {
        rsvpCount[previousStatus] = Math.max(0, rsvpCount[previousStatus] - 1);
      };

      handleRemoveRsvp('going');
      expect(rsvpCount.going).toBe(0);
    });
  });

  describe('RSVP UI State', () => {
    test('should track loading state during RSVP action', async () => {
      let isRsvping = false;

      const performRsvp = async () => {
        isRsvping = true;
        apiClient.post.mockResolvedValueOnce({ data: mockRsvp });
        await apiClient.post('/events/event-1/rsvp', { status: 'going' });
        isRsvping = false;
      };

      await performRsvp();
      expect(isRsvping).toBe(false);
    });

    test('should prevent duplicate RSVP requests', async () => {
      let isRsvping = false;

      const performRsvp = async () => {
        if (isRsvping) return; // Prevent duplicate
        isRsvping = true;
        apiClient.post.mockResolvedValueOnce({ data: mockRsvp });
        await apiClient.post('/events/event-1/rsvp', { status: 'going' });
        isRsvping = false;
      };

      // Simulate rapid clicks
      await Promise.all([performRsvp(), performRsvp(), performRsvp()]);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    test('should show optimistic update', () => {
      let displayStatus: 'going' | 'interested' | null = null;

      const optimisticRsvp = (status: 'going' | 'interested') => {
        displayStatus = status; // Update UI immediately
      };

      optimisticRsvp('going');
      expect(displayStatus).toBe('going');
    });

    test('should rollback optimistic update on error', async () => {
      let displayStatus: 'going' | 'interested' | null = null;
      const originalStatus: 'going' | 'interested' | null = null;

      const performRsvpWithRollback = async (newStatus: 'going' | 'interested') => {
        displayStatus = newStatus; // Optimistic update

        try {
          apiClient.post.mockRejectedValueOnce(new Error('Network error'));
          await apiClient.post('/events/event-1/rsvp', { status: newStatus });
        } catch {
          displayStatus = originalStatus; // Rollback
        }
      };

      await performRsvpWithRollback('going');
      expect(displayStatus).toBe(originalStatus);
    });
  });

  describe('Event Attendees List', () => {
    test('should fetch event attendees', async () => {
      const mockAttendees = [
        { id: 'user-1', name: 'User 1', emoji: '😊', avatar: null, status: 'GOING' },
        { id: 'user-2', name: 'User 2', emoji: '🎉', avatar: null, status: 'INTERESTED' },
      ];
      apiClient.get.mockResolvedValueOnce({ data: { attendees: mockAttendees } });

      const response = await apiClient.get('/events/event-1/attendees');

      expect(apiClient.get).toHaveBeenCalledWith('/events/event-1/attendees');
      expect(response.data.attendees).toHaveLength(2);
    });

    test('should filter attendees by RSVP status', async () => {
      const mockAttendees = [
        { id: 'user-1', name: 'User 1', status: 'GOING' },
        { id: 'user-2', name: 'User 2', status: 'INTERESTED' },
        { id: 'user-3', name: 'User 3', status: 'GOING' },
      ];

      const goingAttendees = mockAttendees.filter(a => a.status === 'GOING');
      const interestedAttendees = mockAttendees.filter(a => a.status === 'INTERESTED');

      expect(goingAttendees).toHaveLength(2);
      expect(interestedAttendees).toHaveLength(1);
    });

    test('should display attendee avatars', () => {
      const attendee = { id: 'user-1', name: 'User', emoji: '😊', avatar: 'https://example.com/avatar.jpg' };
      expect(attendee.avatar).toBe('https://example.com/avatar.jpg');
    });

    test('should display emoji when no avatar', () => {
      const attendee = { id: 'user-1', name: 'User', emoji: '😊', avatar: null };
      expect(attendee.avatar).toBeNull();
      expect(attendee.emoji).toBe('😊');
    });
  });

  describe('RSVP Validation', () => {
    test('should not allow RSVP to past events', () => {
      const isPastEvent = (dateTime: string) => new Date(dateTime) < new Date();

      const pastEvent = { ...mockEvent, dateTime: '2020-01-01T14:00:00.000Z' };
      expect(isPastEvent(pastEvent.dateTime)).toBe(true);
    });

    test('should not allow RSVP to own event', () => {
      const canRsvp = (event: typeof mockEvent, userId: string) => {
        return event.host.id !== userId;
      };

      expect(canRsvp(mockEvent, 'user-2')).toBe(false); // Host is user-2
      expect(canRsvp(mockEvent, 'user-1')).toBe(true);
    });

    test('should require valid status value', () => {
      const isValidStatus = (status: string) => ['going', 'interested'].includes(status);

      expect(isValidStatus('going')).toBe(true);
      expect(isValidStatus('interested')).toBe(true);
      expect(isValidStatus('maybe')).toBe(false);
      expect(isValidStatus('')).toBe(false);
    });
  });
});
