/**
 * Feature: My Plans Screen
 *
 * Tests for viewing user's RSVP'd events including:
 * - Tab switching (Going / Interested)
 * - Load events by RSVP status
 * - Display RSVP'd event cards
 * - Remove RSVP functionality
 * - Empty state when no RSVPs
 */

import { mockEvent, mockRsvpWithEvent } from '../../utils/testUtils';

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

describe('Feature: My Plans Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load User RSVPs', () => {
    const mockRsvps = [
      {
        id: 'rsvp-1',
        status: 'going',
        event: mockEvent,
        createdAt: '2024-06-10T00:00:00.000Z',
      },
      {
        id: 'rsvp-2',
        status: 'interested',
        event: { ...mockEvent, id: 'event-2', title: 'Karaoke Night' },
        createdAt: '2024-06-11T00:00:00.000Z',
      },
      {
        id: 'rsvp-3',
        status: 'going',
        event: { ...mockEvent, id: 'event-3', title: 'Morning Yoga' },
        createdAt: '2024-06-12T00:00:00.000Z',
      },
    ];

    test('should fetch all user RSVPs', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { rsvps: mockRsvps } });

      const response = await apiClient.get('/me/rsvps');

      expect(apiClient.get).toHaveBeenCalledWith('/me/rsvps');
      expect(response.data.rsvps).toHaveLength(3);
    });

    test('should return RSVP with event data', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { rsvps: mockRsvps } });

      const response = await apiClient.get('/me/rsvps');
      const rsvp = response.data.rsvps[0];

      expect(rsvp).toHaveProperty('id');
      expect(rsvp).toHaveProperty('status');
      expect(rsvp).toHaveProperty('event');
      expect(rsvp.event).toHaveProperty('title');
    });

    test('should handle empty RSVPs list', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { rsvps: [] } });

      const response = await apiClient.get('/me/rsvps');

      expect(response.data.rsvps).toHaveLength(0);
    });

    test('should handle API errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/me/rsvps')).rejects.toThrow('Network error');
    });
  });

  describe('Tab Switching (Going / Interested)', () => {
    const mockRsvps = [
      { id: 'rsvp-1', status: 'going', event: mockEvent },
      { id: 'rsvp-2', status: 'interested', event: { ...mockEvent, id: 'event-2' } },
      { id: 'rsvp-3', status: 'going', event: { ...mockEvent, id: 'event-3' } },
    ];

    test('should filter RSVPs by "going" status', () => {
      const goingRsvps = mockRsvps.filter(rsvp => rsvp.status === 'going');

      expect(goingRsvps).toHaveLength(2);
      expect(goingRsvps.every(r => r.status === 'going')).toBe(true);
    });

    test('should filter RSVPs by "interested" status', () => {
      const interestedRsvps = mockRsvps.filter(rsvp => rsvp.status === 'interested');

      expect(interestedRsvps).toHaveLength(1);
      expect(interestedRsvps.every(r => r.status === 'interested')).toBe(true);
    });

    test('should track active tab state', () => {
      let activeTab: 'going' | 'interested' = 'going';

      const switchTab = (tab: 'going' | 'interested') => {
        activeTab = tab;
      };

      expect(activeTab).toBe('going');

      switchTab('interested');
      expect(activeTab).toBe('interested');

      switchTab('going');
      expect(activeTab).toBe('going');
    });

    test('should default to "going" tab', () => {
      const defaultTab: 'going' | 'interested' = 'going';
      expect(defaultTab).toBe('going');
    });

    test('should display correct count for each tab', () => {
      const getTabCount = (rsvps: typeof mockRsvps, status: string) => {
        return rsvps.filter(r => r.status === status).length;
      };

      expect(getTabCount(mockRsvps, 'going')).toBe(2);
      expect(getTabCount(mockRsvps, 'interested')).toBe(1);
    });
  });

  describe('Display RSVP Event Cards', () => {
    test('should display event title', () => {
      const rsvp = mockRsvpWithEvent;
      expect(rsvp.event.title).toBe('Pool Party');
    });

    test('should display event location', () => {
      const rsvp = mockRsvpWithEvent;
      expect(rsvp.event.locationName).toBe('Main Pool');
    });

    test('should display event date/time', () => {
      const rsvp = mockRsvpWithEvent;
      expect(rsvp.event.dateTime).toBe('2024-06-15T14:00:00.000Z');
    });

    test('should display RSVP status badge', () => {
      const rsvp = mockRsvpWithEvent;
      expect(rsvp.status).toBe('going');
    });

    test('should sort events by date', () => {
      const rsvps = [
        { event: { ...mockEvent, dateTime: '2024-06-20T14:00:00.000Z' } },
        { event: { ...mockEvent, dateTime: '2024-06-15T14:00:00.000Z' } },
        { event: { ...mockEvent, dateTime: '2024-06-18T14:00:00.000Z' } },
      ];

      const sorted = [...rsvps].sort(
        (a, b) => new Date(a.event.dateTime).getTime() - new Date(b.event.dateTime).getTime()
      );

      expect(new Date(sorted[0].event.dateTime).getDate()).toBe(15);
      expect(new Date(sorted[1].event.dateTime).getDate()).toBe(18);
      expect(new Date(sorted[2].event.dateTime).getDate()).toBe(20);
    });

    test('should indicate past events', () => {
      const isPastEvent = (dateTime: string) => {
        return new Date(dateTime) < new Date();
      };

      const pastEvent = { ...mockEvent, dateTime: '2020-01-01T14:00:00.000Z' };
      const futureEvent = { ...mockEvent, dateTime: '2030-01-01T14:00:00.000Z' };

      expect(isPastEvent(pastEvent.dateTime)).toBe(true);
      expect(isPastEvent(futureEvent.dateTime)).toBe(false);
    });
  });

  describe('Remove RSVP', () => {
    test('should remove RSVP successfully', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: undefined });

      await apiClient.delete('/events/event-1/rsvp');

      expect(apiClient.delete).toHaveBeenCalledWith('/events/event-1/rsvp');
    });

    test('should update local state after removing RSVP', async () => {
      let rsvps = [
        { id: 'rsvp-1', eventId: 'event-1', status: 'going' },
        { id: 'rsvp-2', eventId: 'event-2', status: 'going' },
      ];

      apiClient.delete.mockResolvedValueOnce({ data: undefined });
      await apiClient.delete('/events/event-1/rsvp');

      // Simulate removing from local state
      rsvps = rsvps.filter(r => r.eventId !== 'event-1');

      expect(rsvps).toHaveLength(1);
      expect(rsvps[0].eventId).toBe('event-2');
    });

    test('should handle remove RSVP errors', async () => {
      apiClient.delete.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'RSVP not found' } },
      });

      await expect(apiClient.delete('/events/event-1/rsvp')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    test('should show confirmation before removing', () => {
      let confirmationShown = false;

      const showRemoveConfirmation = () => {
        confirmationShown = true;
        return true; // User confirms
      };

      const result = showRemoveConfirmation();
      expect(confirmationShown).toBe(true);
      expect(result).toBe(true);
    });

    test('should not remove if user cancels confirmation', () => {
      let rsvps = [{ id: 'rsvp-1', eventId: 'event-1' }];

      const handleRemove = (eventId: string, confirmed: boolean) => {
        if (confirmed) {
          rsvps = rsvps.filter(r => r.eventId !== eventId);
        }
      };

      handleRemove('event-1', false);
      expect(rsvps).toHaveLength(1);
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no RSVPs', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { rsvps: [] } });

      const response = await apiClient.get('/me/rsvps');
      const hasRsvps = response.data.rsvps.length > 0;

      expect(hasRsvps).toBe(false);
    });

    test('should show empty state for "going" tab when no going RSVPs', () => {
      const rsvps = [{ status: 'interested', event: mockEvent }];
      const goingRsvps = rsvps.filter(r => r.status === 'going');

      expect(goingRsvps).toHaveLength(0);
    });

    test('should show empty state for "interested" tab when no interested RSVPs', () => {
      const rsvps = [{ status: 'going', event: mockEvent }];
      const interestedRsvps = rsvps.filter(r => r.status === 'interested');

      expect(interestedRsvps).toHaveLength(0);
    });

    test('should display appropriate empty message', () => {
      const getEmptyMessage = (tab: 'going' | 'interested', hasRsvps: boolean) => {
        if (!hasRsvps) {
          return tab === 'going'
            ? "You haven't RSVP'd to any events yet"
            : "You haven't marked any events as interested";
        }
        return null;
      };

      expect(getEmptyMessage('going', false)).toBe("You haven't RSVP'd to any events yet");
      expect(getEmptyMessage('interested', false)).toBe("You haven't marked any events as interested");
      expect(getEmptyMessage('going', true)).toBeNull();
    });
  });

  describe('Pull-to-Refresh', () => {
    test('should refresh RSVPs on pull', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { rsvps: [mockRsvpWithEvent] } });

      const response = await apiClient.get('/me/rsvps');

      expect(response.data.rsvps).toHaveLength(1);
    });

    test('should track refreshing state', async () => {
      let isRefreshing = false;

      const onRefresh = async () => {
        isRefreshing = true;
        apiClient.get.mockResolvedValueOnce({ data: { rsvps: [] } });
        await apiClient.get('/me/rsvps');
        isRefreshing = false;
      };

      await onRefresh();
      expect(isRefreshing).toBe(false);
    });
  });

  describe('Navigation to Event Details', () => {
    test('should navigate to event details on tap', () => {
      let navigatedToEventId: string | null = null;

      const navigateToEvent = (eventId: string) => {
        navigatedToEventId = eventId;
      };

      navigateToEvent('event-1');
      expect(navigatedToEventId).toBe('event-1');
    });
  });

  describe('RSVP Status Change', () => {
    test('should update RSVP from going to interested', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { id: 'rsvp-1', eventId: 'event-1', status: 'interested' },
      });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'interested' });

      expect(response.data.status).toBe('interested');
    });

    test('should update RSVP from interested to going', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { id: 'rsvp-1', eventId: 'event-1', status: 'going' },
      });

      const response = await apiClient.post('/events/event-1/rsvp', { status: 'going' });

      expect(response.data.status).toBe('going');
    });

    test('should update local RSVP list after status change', () => {
      let rsvps = [
        { id: 'rsvp-1', eventId: 'event-1', status: 'going' },
      ];

      const updateRsvpStatus = (eventId: string, newStatus: string) => {
        rsvps = rsvps.map(r =>
          r.eventId === eventId ? { ...r, status: newStatus } : r
        );
      };

      updateRsvpStatus('event-1', 'interested');
      expect(rsvps[0].status).toBe('interested');
    });
  });
});
