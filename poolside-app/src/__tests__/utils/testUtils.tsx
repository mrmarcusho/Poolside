/**
 * Test Utilities for Poolside App
 * Common utilities, mock data, and helpers for all feature tests
 */

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// ============================================
// MOCK DATA
// ============================================

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  emoji: '😊',
  avatar: null,
  bio: 'Test bio',
  age: 25,
  location: 'Miami',
  school: 'Test University',
  interests: [
    { emoji: '🎮', label: 'Gaming' },
    { emoji: '🎵', label: 'Music' },
  ],
  cabinNumber: 'A123',
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const mockEvent = {
  id: 'event-1',
  title: 'Pool Party',
  description: 'Fun pool party on deck',
  fullDescription: 'Join us for an amazing pool party with music and drinks!',
  locationName: 'Main Pool',
  locationDeck: 'Deck 10',
  locationImage: null,
  eventImage: null,
  dateTime: '2024-06-15T14:00:00.000Z',
  endTime: '2024-06-15T18:00:00.000Z',
  category: 'Social',
  theme: { bgColor: '#3B82F6', textColor: '#FFFFFF' },
  host: {
    id: 'user-2',
    name: 'Party Host',
    emoji: '🎉',
    avatar: null,
  },
  rsvpCount: { going: 15, interested: 8 },
  spots: null as number | null, // null = unlimited capacity
  isFull: false,
  myRsvp: null,
  createdAt: '2024-06-01T00:00:00.000Z',
};

// Mock events for capacity testing
export const mockEventWithCapacity = {
  ...mockEvent,
  id: 'event-capacity-1',
  title: 'Limited Capacity Event',
  spots: 20,
  rsvpCount: { going: 15, interested: 5 },
  isFull: false,
};

export const mockFullEvent = {
  ...mockEvent,
  id: 'event-full-1',
  title: 'Full Event',
  spots: 20,
  rsvpCount: { going: 20, interested: 10 },
  isFull: true,
};

export const mockAlmostFullEvent = {
  ...mockEvent,
  id: 'event-almost-full-1',
  title: 'Almost Full Event',
  spots: 20,
  rsvpCount: { going: 19, interested: 5 },
  isFull: false,
};

export const mockEvents = [
  mockEvent,
  {
    ...mockEvent,
    id: 'event-2',
    title: 'Karaoke Night',
    description: 'Sing your heart out',
    locationName: 'Lounge',
    locationDeck: 'Deck 5',
    dateTime: '2024-06-16T20:00:00.000Z',
    rsvpCount: { going: 10, interested: 5 },
  },
  {
    ...mockEvent,
    id: 'event-3',
    title: 'Morning Yoga',
    description: 'Start your day right',
    locationName: 'Fitness Center',
    locationDeck: 'Deck 8',
    dateTime: '2024-06-17T07:00:00.000Z',
    rsvpCount: { going: 8, interested: 12 },
  },
];

export const mockEventsResponse = {
  events: mockEvents,
  hasMore: true,
  total: 10,
  nextCursor: 'cursor-123',
};

export const mockConversation = {
  id: 'conv-1',
  participant: {
    id: 'user-2',
    name: 'Chat Partner',
    emoji: '🙂',
    avatar: null,
    isOnline: true,
  },
  lastMessage: {
    text: 'Hey, are you coming to the party?',
    sentAt: '2024-06-15T10:30:00.000Z',
    isFromMe: false,
  },
  unreadCount: 2,
};

export const mockConversations = [
  mockConversation,
  {
    id: 'conv-2',
    participant: {
      id: 'user-3',
      name: 'Another Friend',
      emoji: '😎',
      avatar: null,
      isOnline: false,
    },
    lastMessage: {
      text: 'Thanks for the info!',
      sentAt: '2024-06-14T18:00:00.000Z',
      isFromMe: true,
    },
    unreadCount: 0,
  },
];

export const mockMessage = {
  id: 'msg-1',
  text: 'Hello there!',
  senderId: 'user-2',
  sentAt: '2024-06-15T10:30:00.000Z',
  readAt: null,
};

export const mockMessages = [
  mockMessage,
  {
    id: 'msg-2',
    text: 'Hi! How are you?',
    senderId: 'user-1',
    sentAt: '2024-06-15T10:31:00.000Z',
    readAt: '2024-06-15T10:31:30.000Z',
  },
  {
    id: 'msg-3',
    text: "I'm good, thanks!",
    senderId: 'user-2',
    sentAt: '2024-06-15T10:32:00.000Z',
    readAt: null,
  },
];

export const mockFriend = {
  id: 'friend-1',
  name: 'Best Friend',
  emoji: '🤗',
  avatar: null,
  isOnline: true,
  friendsSince: '2024-01-15T00:00:00.000Z',
};

export const mockFriends = [
  mockFriend,
  {
    id: 'friend-2',
    name: 'Cruise Buddy',
    emoji: '🚢',
    avatar: null,
    isOnline: false,
    friendsSince: '2024-02-20T00:00:00.000Z',
  },
];

export const mockFriendRequest = {
  id: 'request-1',
  from: {
    id: 'user-5',
    name: 'New Friend',
    emoji: '👋',
    avatar: null,
  },
  createdAt: '2024-06-14T12:00:00.000Z',
};

export const mockFriendRequests = [
  mockFriendRequest,
  {
    id: 'request-2',
    from: {
      id: 'user-6',
      name: 'Another Request',
      emoji: '🎉',
      avatar: null,
    },
    createdAt: '2024-06-13T15:00:00.000Z',
  },
];

export const mockNotification = {
  id: 'notif-1',
  type: 'friend_request',
  title: 'New Friend Request',
  body: 'John wants to be your friend',
  data: JSON.stringify({ userId: 'user-5' }),
  readAt: null,
  createdAt: '2024-06-15T09:00:00.000Z',
};

export const mockNotifications = [
  mockNotification,
  {
    id: 'notif-2',
    type: 'event_reminder',
    title: 'Event Starting Soon',
    body: 'Pool Party starts in 1 hour',
    data: JSON.stringify({ eventId: 'event-1' }),
    readAt: '2024-06-15T08:00:00.000Z',
    createdAt: '2024-06-15T07:00:00.000Z',
  },
];

export const mockRsvp = {
  id: 'rsvp-1',
  eventId: 'event-1',
  status: 'going' as const,
  createdAt: '2024-06-10T00:00:00.000Z',
};

export const mockRsvpWithEvent = {
  ...mockRsvp,
  event: mockEvent,
};

// ============================================
// MOCK API RESPONSES
// ============================================

export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

// ============================================
// TEST PROVIDERS
// ============================================

interface TestProvidersProps {
  children: ReactNode;
}

export const TestProviders: React.FC<TestProvidersProps> = ({ children }) => {
  return <>{children}</>;
};

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: TestProviders, ...options });
};

// ============================================
// MOCK FUNCTIONS HELPERS
// ============================================

export const createMockAxiosInstance = () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    baseURL: 'http://localhost:3000/v1',
    headers: { 'Content-Type': 'application/json' },
  },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
});

export const createMockSocket = () => ({
  connected: true,
  id: 'mock-socket-id',
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
});

// ============================================
// ASYNC HELPERS
// ============================================

export const waitForAsync = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () =>
  new Promise(resolve => setImmediate(resolve));

// ============================================
// RE-EXPORTS
// ============================================

export * from '@testing-library/react-native';
