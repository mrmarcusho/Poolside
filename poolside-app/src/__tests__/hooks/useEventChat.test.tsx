/**
 * Tests for useEventChat hook
 *
 * Critical test: Verify that useEventChat does NOT call leaveEventChat on cleanup
 * This was the bug that caused FriendsScreen to stop receiving messages
 * after a user viewed a specific event chat.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// Track socket service calls
const mockJoinEventChat = jest.fn();
const mockLeaveEventChat = jest.fn();
const mockOnNewEventMessage = jest.fn();
const mockOffNewEventMessage = jest.fn();
const mockOnEventUserTyping = jest.fn();
const mockOffEventUserTyping = jest.fn();
const mockOnEventUserStoppedTyping = jest.fn();
const mockOffEventUserStoppedTyping = jest.fn();

jest.mock('../../api/socket', () => ({
  socketService: {
    joinEventChat: (...args: any[]) => mockJoinEventChat(...args),
    leaveEventChat: (...args: any[]) => mockLeaveEventChat(...args),
    onNewEventMessage: (...args: any[]) => mockOnNewEventMessage(...args),
    offNewEventMessage: (...args: any[]) => mockOffNewEventMessage(...args),
    onEventUserTyping: (...args: any[]) => mockOnEventUserTyping(...args),
    offEventUserTyping: (...args: any[]) => mockOffEventUserTyping(...args),
    onEventUserStoppedTyping: (...args: any[]) => mockOnEventUserStoppedTyping(...args),
    offEventUserStoppedTyping: (...args: any[]) => mockOffEventUserStoppedTyping(...args),
    sendEventMessage: jest.fn(),
    startEventTyping: jest.fn(),
    stopEventTyping: jest.fn(),
    getMessageReplies: jest.fn(),
  },
}));

jest.mock('../../api/services/eventChat', () => ({
  eventChatService: {
    getEventMessages: jest.fn(() => Promise.resolve({ messages: [], hasMore: false })),
  },
}));

import { useEventChat } from '../../hooks/useEventChat';

describe('useEventChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Management', () => {
    it('should join event chat room when socket is connected', async () => {
      const { result } = renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: true })
      );

      await waitFor(() => {
        expect(mockJoinEventChat).toHaveBeenCalledWith('test-event-123');
      });
    });

    it('should NOT join event chat room when socket is not connected', async () => {
      const { result } = renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: false })
      );

      // Wait a bit to ensure effect would have run
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockJoinEventChat).not.toHaveBeenCalled();
    });

    it('should NOT call leaveEventChat on cleanup - THIS IS THE CRITICAL FIX', async () => {
      // This test verifies the bug fix:
      // Previously, useEventChat would call leaveEventChat on cleanup,
      // which kicked the user out of the room that FriendsScreen expected them to be in.

      const { unmount } = renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: true })
      );

      // Verify it joined
      await waitFor(() => {
        expect(mockJoinEventChat).toHaveBeenCalledWith('test-event-123');
      });

      // Unmount the hook (simulating ChatScreen unmount)
      unmount();

      // CRITICAL: leaveEventChat should NOT be called
      // This was the bug - calling leaveEventChat here would kick the user
      // out of the room, breaking FriendsScreen's ability to receive messages
      expect(mockLeaveEventChat).not.toHaveBeenCalled();
    });

    it('should remove listeners on cleanup', async () => {
      const { unmount } = renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: true })
      );

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockOnNewEventMessage).toHaveBeenCalled();
      });

      // Unmount
      unmount();

      // Listeners should be removed
      expect(mockOffNewEventMessage).toHaveBeenCalled();
      expect(mockOffEventUserTyping).toHaveBeenCalled();
      expect(mockOffEventUserStoppedTyping).toHaveBeenCalled();
    });
  });

  describe('Message Listeners', () => {
    it('should register message listener when connected', async () => {
      renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: true })
      );

      await waitFor(() => {
        expect(mockOnNewEventMessage).toHaveBeenCalled();
      });
    });

    it('should register typing listeners when connected', async () => {
      renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: true })
      );

      await waitFor(() => {
        expect(mockOnEventUserTyping).toHaveBeenCalled();
        expect(mockOnEventUserStoppedTyping).toHaveBeenCalled();
      });
    });

    it('should NOT register listeners when socket is not connected', async () => {
      renderHook(() =>
        useEventChat({ eventId: 'test-event-123', isSocketConnected: false })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOnNewEventMessage).not.toHaveBeenCalled();
      expect(mockOnEventUserTyping).not.toHaveBeenCalled();
    });
  });

  describe('Integration with FriendsScreen scenario', () => {
    it('should allow FriendsScreen to remain in room after ChatScreen unmounts', async () => {
      // This simulates the real-world scenario:
      // 1. FriendsScreen joins all event rooms (managed separately)
      // 2. User opens ChatScreen for event-1 (useEventChat joins, registers listeners)
      // 3. User closes ChatScreen (useEventChat cleanup runs)
      // 4. FriendsScreen should still be in room (leaveEventChat NOT called)

      // Simulate ChatScreen mounting
      const { unmount } = renderHook(() =>
        useEventChat({ eventId: 'event-1', isSocketConnected: true })
      );

      await waitFor(() => {
        expect(mockJoinEventChat).toHaveBeenCalledWith('event-1');
      });

      // Simulate ChatScreen unmounting (user goes back to FriendsScreen)
      unmount();

      // Verify the fix: leaveEventChat should NOT be called
      expect(mockLeaveEventChat).not.toHaveBeenCalled();

      // This means FriendsScreen's room membership is preserved
      // and it will continue to receive messages for event-1
    });

    it('should handle multiple mount/unmount cycles without leaving room', async () => {
      // User opens chat, closes, opens again, closes again
      // Should never call leaveEventChat

      for (let i = 0; i < 3; i++) {
        const { unmount } = renderHook(() =>
          useEventChat({ eventId: 'event-1', isSocketConnected: true })
        );

        await waitFor(() => {
          expect(mockJoinEventChat).toHaveBeenCalled();
        });

        unmount();
      }

      // After 3 mount/unmount cycles, leaveEventChat should never have been called
      expect(mockLeaveEventChat).not.toHaveBeenCalled();
    });
  });
});
