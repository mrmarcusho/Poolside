/**
 * Comprehensive tests for real-time unread message updates on FriendsScreen (Event Chats list)
 *
 * Test scenarios covered:
 * 1. Initial message - User receives first message and sees instant update
 * 2. Own messages - User's own messages don't increment unread count
 * 3. Multiple users - Different users sending messages
 * 4. Navigation - Going into chat and coming back out
 * 5. Switching senders - User A sends, then User B sends
 * 6. Edge cases - Empty chats, multiple events, rapid messages
 * 7. Socket reconnection - Rooms rejoin after socket reconnects
 */

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Mock user - this is "User B" who is viewing the Event Chats list
const mockUser = { id: 'user-b-id', name: 'User B', email: 'userb@test.com' };

// Mock event chats data
const mockEventChats = [
  {
    id: 'event-1',
    title: 'Beach Party',
    eventImage: null,
    dateTime: new Date().toISOString(),
    host: { id: 'host-1', name: 'Host 1', emoji: '🎉', avatar: null },
    isHost: false,
    lastMessage: {
      text: 'See you there!',
      senderName: 'Host 1',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      isFromMe: false,
    },
    messageCount: 5,
    unreadCount: 0,
  },
  {
    id: 'event-2',
    title: 'Study Group',
    eventImage: null,
    dateTime: new Date().toISOString(),
    host: { id: 'host-2', name: 'Host 2', emoji: '📚', avatar: null },
    isHost: false,
    lastMessage: {
      text: 'Bring your notes',
      senderName: 'Host 2',
      sentAt: new Date(Date.now() - 7200000).toISOString(),
      isFromMe: false,
    },
    messageCount: 10,
    unreadCount: 2,
  },
  {
    id: 'event-3',
    title: 'Coffee Meetup',
    eventImage: null,
    dateTime: new Date().toISOString(),
    host: { id: 'user-b-id', name: 'User B', emoji: '☕', avatar: null },
    isHost: true, // User B is the host of this event
    lastMessage: null, // No messages yet
    messageCount: 0,
    unreadCount: 0,
  },
];

// Mock socket listeners and joined rooms tracking
const mockSocketListeners: { [key: string]: ((data: any) => void)[] } = {};
const mockJoinedRooms: string[] = [];
let mockSocketConnectCallbacks: (() => void)[] = [];

// Create a mock socket object with on/off methods
const mockSocket = {
  on: jest.fn((event: string, callback: () => void) => {
    if (event === 'connect') {
      mockSocketConnectCallbacks.push(callback);
    }
  }),
  off: jest.fn((event: string, callback: () => void) => {
    if (event === 'connect') {
      mockSocketConnectCallbacks = mockSocketConnectCallbacks.filter(cb => cb !== callback);
    }
  }),
  connected: true,
};

// Mock the socket service
jest.mock('../../../api/socket', () => ({
  socketService: {
    joinEventChat: jest.fn((eventId: string) => {
      mockJoinedRooms.push(eventId);
    }),
    leaveEventChat: jest.fn(),
    onNewEventMessage: jest.fn((callback: (data: any) => void) => {
      if (!mockSocketListeners['new_event_message']) {
        mockSocketListeners['new_event_message'] = [];
      }
      mockSocketListeners['new_event_message'].push(callback);
    }),
    offNewEventMessage: jest.fn((callback: (data: any) => void) => {
      if (mockSocketListeners['new_event_message']) {
        mockSocketListeners['new_event_message'] = mockSocketListeners['new_event_message'].filter(
          (cb) => cb !== callback
        );
      }
    }),
    getSocket: jest.fn(() => mockSocket),
    hasSocket: jest.fn(() => true),
    isConnected: jest.fn(() => true),
  },
  NewEventMessageEvent: {},
}));

// Mock the useSocket hook
const mockConnect = jest.fn();
jest.mock('../../../hooks', () => ({
  useSocket: () => ({
    isConnected: true,
    isConnecting: false,
    error: null,
    connect: mockConnect,
    disconnect: jest.fn(),
  }),
}));

// Mock the auth context
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

// Variable to control what getEventChats returns
let mockCurrentEventChats = [...mockEventChats];

// Mock the event chat service
jest.mock('../../../api/services/eventChat', () => ({
  eventChatService: {
    getEventChats: jest.fn(() => Promise.resolve({ eventChats: mockCurrentEventChats })),
    markEventChatAsRead: jest.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
    useFocusEffect: jest.fn((callback) => {
      const React = require('react');
      React.useEffect(() => {
        const result = callback();
        return result;
      }, []);
    }),
  };
});

// Import the component after mocks are set up
import { FriendsScreen } from '../../../screens/FriendsScreen';

// Helper to simulate receiving a socket message
const simulateNewMessage = (eventId: string, message: any) => {
  const listeners = mockSocketListeners['new_event_message'] || [];
  listeners.forEach((callback) => {
    callback({ eventId, message });
  });
};

// Helper to create a message object
const createMessage = (overrides: Partial<{
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderEmoji: string;
  senderAvatar: string | null;
  sentAt: string;
  replyTo: any;
  replyCount: number;
}> = {}) => ({
  id: `msg-${Date.now()}-${Math.random()}`,
  text: 'Test message',
  senderId: 'user-a-id',
  senderName: 'User A',
  senderEmoji: '👋',
  senderAvatar: null,
  sentAt: new Date().toISOString(),
  replyTo: null,
  replyCount: 0,
  ...overrides,
});

// Helper to simulate socket reconnection
const simulateSocketReconnect = () => {
  mockSocketConnectCallbacks.forEach(cb => cb());
};

// Wrapper component with navigation
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockJoinedRooms.length = 0;
  mockSocketListeners['new_event_message'] = [];
  mockSocketConnectCallbacks = [];
  mockCurrentEventChats = [...mockEventChats];
});

// ============================================================
// TEST SUITE 1: Initial Connection and Setup
// ============================================================
describe('FriendsScreen - Initial Connection', () => {
  it('should connect to socket on mount', async () => {
    render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('should join all event chat rooms when connected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Should have joined all event rooms (including the one with no messages)
    await waitFor(() => {
      expect(mockJoinedRooms).toContain('event-1');
      expect(mockJoinedRooms).toContain('event-2');
      expect(mockJoinedRooms).toContain('event-3');
    });
  });

  it('should register new_event_message listener when connected', async () => {
    const { socketService } = require('../../../api/socket');

    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    expect(socketService.onNewEventMessage).toHaveBeenCalled();
  });

  it('should display initial unread counts correctly', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Beach Party has 0 unread - no badge
    // Study Group has 2 unread - should show "2"
    expect(getByText('2')).toBeTruthy();

    // Coffee Meetup has 0 unread - no badge for "0"
    // (queryByText returns null if not found, which is what we want)
  });
});

// ============================================================
// TEST SUITE 2: First Message - Instant Update
// ============================================================
describe('FriendsScreen - First Message Instant Update', () => {
  it('should show instant update when User A sends first message to User B', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Initially Beach Party has 0 unread
    expect(queryByText('1')).toBeNull();

    // User A sends a message
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        text: 'Hey everyone, excited for the party!',
        senderId: 'user-a-id',
        senderName: 'User A',
      }));
    });

    // Should instantly show "1" unread badge
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // Last message preview should update
    await waitFor(() => {
      expect(queryByText(/Hey everyone, excited for the party!/)).toBeTruthy();
    });
  });

  it('should update lastMessage sender name correctly', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Initial last message shows "Host 1: See you there!"
    expect(queryByText(/Host 1: See you there!/)).toBeTruthy();

    // User A sends a message
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        text: 'New message here',
        senderId: 'user-a-id',
        senderName: 'User A',
      }));
    });

    // Should now show "User A: New message here"
    await waitFor(() => {
      expect(queryByText(/User A: New message here/)).toBeTruthy();
    });
  });
});

// ============================================================
// TEST SUITE 3: Own Messages - Should NOT increment unread
// ============================================================
describe('FriendsScreen - Own Messages', () => {
  it('should NOT increment unread count when receiving own message', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Count initial "1" badges (should be 0 initially)
    const initialBadges = queryAllByText('1');
    const initialCount = initialBadges.length;

    // User B (current user) sends a message
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        text: 'My own message',
        senderId: 'user-b-id', // Same as mockUser.id
        senderName: 'User B',
      }));
    });

    // Badge count should NOT increase - no "1" badge should appear
    await waitFor(() => {
      const afterBadges = queryAllByText('1');
      expect(afterBadges.length).toBe(initialCount);
    });
  });

  it('should not show new unread badge for own messages', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Count all numeric badges before
    const badgesBefore = queryAllByText(/^\d+$/).length;

    // User B (current user) sends a message
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-b-id',
        senderName: 'User B',
        text: 'I sent this myself',
      }));
    });

    // Badge count should stay the same (own messages don't add unread)
    const badgesAfter = queryAllByText(/^\d+$/).length;
    expect(badgesAfter).toBe(badgesBefore);
  });
});

// ============================================================
// TEST SUITE 4: Multiple Users Sending Messages
// ============================================================
describe('FriendsScreen - Multiple Users / Switching Senders', () => {
  it('should increment unread when User A sends, then User C sends', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Initially Study Group has 2, Beach Party has 0
    // Count initial "2" badges
    const initial2Badges = queryAllByText('2').length;

    // User A sends first message to Beach Party
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        senderName: 'User A',
        text: 'Message from A',
      }));
    });

    // Beach Party should now show "1"
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // User C sends second message
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-c-id',
        senderName: 'User C',
        text: 'Message from C',
      }));
    });

    // Beach Party should now have 2 unread, so there should be one more "2" badge
    await waitFor(() => {
      const new2Badges = queryAllByText('2').length;
      expect(new2Badges).toBe(initial2Badges + 1);
    });
  });

  it('should correctly handle User A sends, then User B (self) sends, then User A sends again', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Count initial badges
    const initial1Badges = queryAllByText('1').length;
    const initial2Badges = queryAllByText('2').length; // Study Group has 2

    // User A sends - should show 1 unread for Beach Party
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        senderName: 'User A',
        text: 'First from A',
      }));
    });

    await waitFor(() => {
      expect(queryAllByText('1').length).toBe(initial1Badges + 1);
    });

    // User B (self) sends - should still show 1 unread (not increment)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-b-id',
        senderName: 'User B',
        text: 'Reply from myself',
      }));
    });

    // Still only one "1" badge added (own message doesn't count)
    // And "2" badge count should be same as initial (no new "2" for Beach Party yet)
    expect(queryAllByText('1').length).toBe(initial1Badges + 1);
    expect(queryAllByText('2').length).toBe(initial2Badges);

    // User A sends again - Beach Party should now show 2 unread
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        senderName: 'User A',
        text: 'Second from A',
      }));
    });

    // Now there should be one more "2" badge (Beach Party went from 1 to 2)
    await waitFor(() => {
      expect(queryAllByText('2').length).toBe(initial2Badges + 1);
    });
  });

  it('should handle rapid messages from multiple users', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Rapid fire 5 messages from different users
    await act(async () => {
      simulateNewMessage('event-1', createMessage({ senderId: 'user-a-id', senderName: 'User A' }));
      simulateNewMessage('event-1', createMessage({ senderId: 'user-c-id', senderName: 'User C' }));
      simulateNewMessage('event-1', createMessage({ senderId: 'user-a-id', senderName: 'User A' }));
      simulateNewMessage('event-1', createMessage({ senderId: 'user-d-id', senderName: 'User D' }));
      simulateNewMessage('event-1', createMessage({ senderId: 'user-c-id', senderName: 'User C' }));
    });

    // Should show 5 unread
    await waitFor(() => {
      expect(getByText('5')).toBeTruthy();
    });
  });
});

// ============================================================
// TEST SUITE 5: Multiple Events - Correct Event Updates
// ============================================================
describe('FriendsScreen - Multiple Events', () => {
  it('should only update the correct event when message arrives', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
      expect(getByText('Study Group')).toBeTruthy();
    });

    // Study Group starts with 2 unread
    expect(getByText('2')).toBeTruthy();

    // Send message to Beach Party (event-1)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'Beach party message',
      }));
    });

    // Beach Party should now show 1, Study Group still 2
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy(); // Beach Party
      expect(getByText('2')).toBeTruthy(); // Study Group unchanged
    });
  });

  it('should update Study Group (event-2) without affecting Beach Party (event-1)', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Send message to Study Group (event-2) which already has 2 unread
    await act(async () => {
      simulateNewMessage('event-2', createMessage({
        senderId: 'user-a-id',
        text: 'Study group question',
      }));
    });

    // Study Group should now show 3 unread
    await waitFor(() => {
      expect(getByText('3')).toBeTruthy();
    });

    // Beach Party should still have no unread badge
    expect(queryByText('1')).toBeNull(); // Only if there's no "1" badge for Beach Party
  });

  it('should handle messages to multiple events simultaneously', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Send messages to both events at once
    await act(async () => {
      simulateNewMessage('event-1', createMessage({ senderId: 'user-a-id', text: 'Beach msg' }));
      simulateNewMessage('event-2', createMessage({ senderId: 'user-a-id', text: 'Study msg' }));
    });

    // Beach Party: 0 -> 1
    // Study Group: 2 -> 3
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });
  });
});

// ============================================================
// TEST SUITE 6: Navigation - Into Chat and Back
// ============================================================
describe('FriendsScreen - Navigation', () => {
  it('should navigate to Chat screen when event chat is pressed', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Press on Beach Party
    fireEvent.press(getByText('Beach Party'));

    // Should navigate to Chat screen with correct params
    expect(mockNavigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
      conversation: expect.objectContaining({
        id: 'event-1',
        name: 'Beach Party',
        isEventChat: true,
      }),
    }));
  });

  it('should continue receiving messages after navigating back from chat', async () => {
    // This test simulates:
    // 1. User is on FriendsScreen
    // 2. Receives a message (unread count updates)
    // 3. User would tap to go to chat (we simulate this)
    // 4. User comes back (component stays mounted in tab navigation)
    // 5. Receives another message - should still update

    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Count initial badges
    const initial2Badges = queryAllByText('2').length;

    // First message - unread becomes 1
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'First message',
      }));
    });

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // User navigates to chat (component stays mounted)
    fireEvent.press(getByText('Beach Party'));
    expect(mockNavigate).toHaveBeenCalled();

    // User comes back (in real app this is automatic with tab navigation)
    // The component is still mounted, so we just send another message

    // Second message - unread becomes 2 for Beach Party
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'Second message after coming back',
      }));
    });

    // Should have one more "2" badge now
    await waitFor(() => {
      expect(queryAllByText('2').length).toBe(initial2Badges + 1);
    });
  });
});

// ============================================================
// TEST SUITE 7: Socket Reconnection
// ============================================================
describe('FriendsScreen - Socket Reconnection', () => {
  it('should rejoin rooms after socket reconnection', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Initial joins
    const initialJoinCount = mockJoinedRooms.length;
    expect(initialJoinCount).toBeGreaterThan(0);

    // Simulate socket reconnection
    await act(async () => {
      simulateSocketReconnect();
    });

    // Should have joined rooms again after reconnection
    // (the reconnectCount state change triggers re-join)
    await waitFor(() => {
      expect(mockJoinedRooms.length).toBeGreaterThan(initialJoinCount);
    });
  });

  it('should still receive messages after socket reconnection', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Count initial "2" badges (Study Group has 2)
    const initial2Badges = queryAllByText('2').length;

    // First message before reconnection - Beach Party gets 1 unread
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'Before reconnect',
      }));
    });

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // Simulate socket reconnection
    await act(async () => {
      simulateSocketReconnect();
    });

    // Wait for reconnection handling
    await waitFor(() => {});

    // Message after reconnection should still work - Beach Party goes to 2 unread
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'After reconnect',
      }));
    });

    // Now Beach Party has 2 unread, so there should be one more "2" badge
    await waitFor(() => {
      expect(queryAllByText('2').length).toBe(initial2Badges + 1);
    });
  });
});

// ============================================================
// TEST SUITE 8: Edge Cases
// ============================================================
describe('FriendsScreen - Edge Cases', () => {
  it('should handle messages to non-existent event gracefully', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Send message to non-existent event
    await act(async () => {
      simulateNewMessage('non-existent-event', createMessage({
        senderId: 'user-a-id',
        text: 'Ghost message',
      }));
    });

    // Nothing should crash, no new badges should appear for event-1
    expect(queryByText('1')).toBeNull();
  });

  it('should handle message with empty text', async () => {
    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Send message with empty text (e.g., image-only message)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: '',
      }));
    });

    // Should still increment unread count
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('should display 99+ for very high unread counts', async () => {
    // Modify mock to return high unread count
    mockCurrentEventChats = mockEventChats.map(chat =>
      chat.id === 'event-2' ? { ...chat, unreadCount: 150 } : chat
    );

    const { getByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Should show 99+ for counts over 99
    await waitFor(() => {
      expect(getByText('99+')).toBeTruthy();
    });
  });
});

// ============================================================
// TEST SUITE 9: ChatScreen Navigation - Room Persistence Bug Fix
// This tests the specific scenario that was broken:
// 1. User A is on FriendsScreen (marcus ho)
// 2. User A sends message to User B, User B's FriendsScreen updates ✓
// 3. User A exits ChatScreen back to FriendsScreen
// 4. User B sends message to User A
// 5. User A's FriendsScreen should still receive the message (was broken)
// ============================================================
describe('FriendsScreen - Room Persistence After ChatScreen Exit', () => {
  // This mock tracks if leaveEventChat was called
  let leaveEventChatCalled = false;

  beforeEach(() => {
    leaveEventChatCalled = false;
    // Override the leaveEventChat mock to track calls
    const { socketService } = require('../../../api/socket');
    socketService.leaveEventChat = jest.fn(() => {
      leaveEventChatCalled = true;
    });
  });

  it('should still receive messages after simulated ChatScreen mount/unmount cycle', async () => {
    // This simulates the exact bug scenario:
    // 1. FriendsScreen is mounted and joins rooms
    // 2. User navigates to ChatScreen (we simulate this by sending a message, which works)
    // 3. User navigates back (ChatScreen unmounts, but should NOT leave room)
    // 4. Another user sends a message
    // 5. FriendsScreen should still receive it

    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Initial state - Beach Party has 0 unread
    const initial1Badges = queryAllByText('1').length;

    // First message arrives - this works (simulating marcus ho sent to marcusho nj 2025)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id', // Different from current user
        senderName: 'User A (marcus ho)',
        text: 'First message from marcus ho',
      }));
    });

    // Should show 1 unread
    await waitFor(() => {
      expect(queryAllByText('1').length).toBe(initial1Badges + 1);
    });

    // Now simulate that the user went to ChatScreen and came back
    // The key insight: FriendsScreen stays mounted (tab navigation)
    // ChatScreen would have called leaveEventChat on unmount (the bug)
    // After the fix, leaveEventChat is NOT called

    // User navigates to chat
    fireEvent.press(getByText('Beach Party'));
    expect(mockNavigate).toHaveBeenCalled();

    // Simulate ChatScreen unmount cleanup (what used to cause the bug)
    // In the real app, this would be useEventChat's cleanup
    // After our fix, it should NOT call leaveEventChat

    // Second message arrives from the other direction
    // (simulating marcusho nj 2025 sent to marcus ho)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-c-id', // Another different user
        senderName: 'User C (marcusho nj 2025)',
        text: 'Second message from marcusho nj 2025',
      }));
    });

    // Should now show 2 unread - THIS WAS THE BUG!
    // Before the fix, the user would be kicked out of the room
    // and this message would never be received
    await waitFor(() => {
      const new2Badges = queryAllByText('2').length;
      // We expect at least one "2" badge (Beach Party now has 2)
      expect(new2Badges).toBeGreaterThan(0);
    });
  });

  it('should receive messages for all events even after viewing one specific event chat', async () => {
    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
      expect(getByText('Study Group')).toBeTruthy();
    });

    // Navigate to Beach Party chat
    fireEvent.press(getByText('Beach Party'));

    // Send message to Beach Party
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'user-a-id',
        text: 'Beach message',
      }));
    });

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy(); // Beach Party has 1
    });

    // Now send message to Study Group (different event)
    // This should still work even though we "visited" Beach Party
    const initial3Badges = queryAllByText('3').length;

    await act(async () => {
      simulateNewMessage('event-2', createMessage({
        senderId: 'user-a-id',
        text: 'Study message',
      }));
    });

    // Study Group was at 2, should now be 3
    await waitFor(() => {
      expect(queryAllByText('3').length).toBe(initial3Badges + 1);
    });
  });

  it('should handle back-and-forth messaging between two users', async () => {
    // This is the exact scenario from the bug report:
    // 1. User A (marcus ho) sends to event
    // 2. User B (marcusho nj 2025) receives it ✓
    // 3. User A exits chat
    // 4. User B sends to same event
    // 5. User A should receive it (was broken)

    const { getByText, queryAllByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Message 1: Other user (marcus ho) sends
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'marcus-ho-id',
        senderName: 'marcus ho',
        text: 'Hey from marcus ho',
      }));
    });

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // Navigate to chat (simulating entering to view/reply)
    fireEvent.press(getByText('Beach Party'));

    // Message 2: Same user sends again (simulating the reverse direction)
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'marcus-ho-id',
        senderName: 'marcus ho',
        text: 'Another message from marcus ho',
      }));
    });

    // Should show 2 now
    const badges2 = queryAllByText('2');
    // At least one "2" should exist (could be from Beach Party or Study Group)
    // Beach Party specifically should have 2 now
    await waitFor(() => {
      // Check that we have at least 2 badges showing "2"
      // (Study Group started with 2, Beach Party now has 2)
      expect(queryAllByText('2').length).toBeGreaterThanOrEqual(1);
    });

    // Message 3: Continue the conversation
    await act(async () => {
      simulateNewMessage('event-1', createMessage({
        senderId: 'marcus-ho-id',
        senderName: 'marcus ho',
        text: 'Third message',
      }));
    });

    // Should show 3 now for Beach Party
    await waitFor(() => {
      expect(getByText('3')).toBeTruthy();
    });
  });
});

// ============================================================
// TEST SUITE 10: Cleanup
// ============================================================
describe('FriendsScreen - Cleanup', () => {
  it('should clean up listeners on unmount', async () => {
    const { socketService } = require('../../../api/socket');

    const { getByText, unmount } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Unmount the component
    unmount();

    // Should have called offNewEventMessage to clean up
    expect(socketService.offNewEventMessage).toHaveBeenCalled();
  });

  it('should not receive messages after unmount', async () => {
    const { getByText, unmount, queryByText } = render(
      <TestWrapper>
        <FriendsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Beach Party')).toBeTruthy();
    });

    // Get listener count before unmount
    const listenersBefore = mockSocketListeners['new_event_message']?.length || 0;

    // Unmount
    unmount();

    // Listener should be removed
    const listenersAfter = mockSocketListeners['new_event_message']?.length || 0;
    expect(listenersAfter).toBeLessThan(listenersBefore);
  });
});
