/**
 * Mock API Client for Testing
 * Provides mock implementations of all API services
 */

import {
  mockUser,
  mockAuthResponse,
  mockEvents,
  mockEventsResponse,
  mockConversations,
  mockMessages,
  mockFriends,
  mockFriendRequests,
  mockNotifications,
  mockRsvp,
  mockRsvpWithEvent,
  mockEvent,
} from './testUtils';

// ============================================
// MOCK API CLIENT
// ============================================

export const mockApiClient = {
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
};

// ============================================
// MOCK TOKEN STORAGE
// ============================================

export const mockTokenStorage = {
  getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
  getRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
  setTokens: jest.fn().mockResolvedValue(undefined),
  clearTokens: jest.fn().mockResolvedValue(undefined),
};

// ============================================
// MOCK AUTH SERVICE
// ============================================

export const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockAuthResponse),
  login: jest.fn().mockResolvedValue(mockAuthResponse),
  logout: jest.fn().mockResolvedValue(undefined),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
};

// ============================================
// MOCK EVENTS SERVICE
// ============================================

export const mockEventsService = {
  getEvents: jest.fn().mockResolvedValue(mockEventsResponse),
  getEventById: jest.fn().mockResolvedValue(mockEvent),
  createEvent: jest.fn().mockResolvedValue(mockEvent),
  updateEvent: jest.fn().mockResolvedValue(mockEvent),
  deleteEvent: jest.fn().mockResolvedValue(undefined),
  getEventAttendees: jest.fn().mockResolvedValue({
    attendees: [
      { id: 'user-1', name: 'Test User', emoji: '😊', avatar: null, status: 'GOING' },
      { id: 'user-2', name: 'Another User', emoji: '🎉', avatar: null, status: 'INTERESTED' },
    ],
  }),
};

// ============================================
// MOCK RSVP SERVICE
// ============================================

export const mockRsvpService = {
  createRsvp: jest.fn().mockResolvedValue(mockRsvp),
  removeRsvp: jest.fn().mockResolvedValue(undefined),
  getMyRsvps: jest.fn().mockResolvedValue({
    rsvps: [mockRsvpWithEvent],
  }),
};

// ============================================
// MOCK MESSAGES SERVICE
// ============================================

export const mockMessagesService = {
  getConversations: jest.fn().mockResolvedValue({ conversations: mockConversations }),
  getMessages: jest.fn().mockResolvedValue({ messages: mockMessages, hasMore: false }),
  sendMessage: jest.fn().mockResolvedValue({
    id: 'new-msg-1',
    text: 'New message',
    senderId: 'user-1',
    sentAt: new Date().toISOString(),
    readAt: null,
  }),
  createConversation: jest.fn().mockResolvedValue({
    conversationId: 'new-conv-1',
    message: null,
  }),
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
};

// ============================================
// MOCK FRIENDS SERVICE
// ============================================

export const mockFriendsService = {
  getFriends: jest.fn().mockResolvedValue({ friends: mockFriends }),
  sendFriendRequest: jest.fn().mockResolvedValue({
    requestId: 'new-request-1',
    toUser: { id: 'user-7', name: 'New Friend' },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }),
  getPendingRequests: jest.fn().mockResolvedValue({ requests: mockFriendRequests }),
  acceptFriendRequest: jest.fn().mockResolvedValue({ success: true }),
  rejectFriendRequest: jest.fn().mockResolvedValue({ success: true }),
  removeFriend: jest.fn().mockResolvedValue({ success: true }),
};

// ============================================
// MOCK USERS SERVICE
// ============================================

export const mockUsersService = {
  getMe: jest.fn().mockResolvedValue(mockUser),
  updateProfile: jest.fn().mockResolvedValue(mockUser),
  getUserById: jest.fn().mockResolvedValue({ ...mockUser, isOnline: true }),
  getUserEvents: jest.fn().mockResolvedValue({ events: mockEvents }),
  searchUsers: jest.fn().mockResolvedValue([
    { id: 'user-10', name: 'Search Result 1', emoji: '👋', avatar: null, isOnline: true, lastSeen: new Date().toISOString() },
    { id: 'user-11', name: 'Search Result 2', emoji: '🎵', avatar: null, isOnline: false, lastSeen: new Date().toISOString() },
  ]),
};

// ============================================
// MOCK NOTIFICATIONS SERVICE
// ============================================

export const mockNotificationsService = {
  getNotifications: jest.fn().mockResolvedValue({
    notifications: mockNotifications,
    hasMore: false,
  }),
  getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 3 }),
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
  markAllAsRead: jest.fn().mockResolvedValue({ success: true }),
};

// ============================================
// MOCK SOCKET SERVICE
// ============================================

export const mockSocketService = {
  connect: jest.fn().mockResolvedValue({
    connected: true,
    id: 'mock-socket-id',
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  }),
  disconnect: jest.fn(),
  getSocket: jest.fn().mockReturnValue(null),
  isConnected: jest.fn().mockReturnValue(false),
  joinConversation: jest.fn(),
  leaveConversation: jest.fn(),
  sendMessage: jest.fn(),
  startTyping: jest.fn(),
  stopTyping: jest.fn(),
  markAsRead: jest.fn(),
  onNewMessage: jest.fn(),
  offNewMessage: jest.fn(),
  onUserTyping: jest.fn(),
  offUserTyping: jest.fn(),
  onUserStoppedTyping: jest.fn(),
  offUserStoppedTyping: jest.fn(),
  onMessagesRead: jest.fn(),
  offMessagesRead: jest.fn(),
  onDisconnect: jest.fn(),
  onReconnect: jest.fn(),
};

// ============================================
// RESET ALL MOCKS
// ============================================

export const resetAllMocks = () => {
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.patch.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.delete.mockReset();

  mockTokenStorage.getAccessToken.mockReset().mockResolvedValue('mock-access-token');
  mockTokenStorage.getRefreshToken.mockReset().mockResolvedValue('mock-refresh-token');
  mockTokenStorage.setTokens.mockReset().mockResolvedValue(undefined);
  mockTokenStorage.clearTokens.mockReset().mockResolvedValue(undefined);

  Object.values(mockAuthService).forEach(fn => fn.mockReset());
  Object.values(mockEventsService).forEach(fn => fn.mockReset());
  Object.values(mockRsvpService).forEach(fn => fn.mockReset());
  Object.values(mockMessagesService).forEach(fn => fn.mockReset());
  Object.values(mockFriendsService).forEach(fn => fn.mockReset());
  Object.values(mockUsersService).forEach(fn => fn.mockReset());
  Object.values(mockNotificationsService).forEach(fn => fn.mockReset());
  Object.values(mockSocketService).forEach(fn => {
    if (typeof fn.mockReset === 'function') fn.mockReset();
  });
};

// ============================================
// SETUP DEFAULT MOCK RESPONSES
// ============================================

export const setupDefaultMocks = () => {
  mockAuthService.register.mockResolvedValue(mockAuthResponse);
  mockAuthService.login.mockResolvedValue(mockAuthResponse);
  mockAuthService.logout.mockResolvedValue(undefined);

  mockEventsService.getEvents.mockResolvedValue(mockEventsResponse);
  mockEventsService.getEventById.mockResolvedValue(mockEvent);
  mockEventsService.createEvent.mockResolvedValue(mockEvent);

  mockRsvpService.createRsvp.mockResolvedValue(mockRsvp);
  mockRsvpService.getMyRsvps.mockResolvedValue({ rsvps: [mockRsvpWithEvent] });

  mockMessagesService.getConversations.mockResolvedValue({ conversations: mockConversations });
  mockMessagesService.getMessages.mockResolvedValue({ messages: mockMessages, hasMore: false });

  mockFriendsService.getFriends.mockResolvedValue({ friends: mockFriends });
  mockFriendsService.getPendingRequests.mockResolvedValue({ requests: mockFriendRequests });

  mockUsersService.getMe.mockResolvedValue(mockUser);

  mockNotificationsService.getNotifications.mockResolvedValue({ notifications: mockNotifications, hasMore: false });
  mockNotificationsService.getUnreadCount.mockResolvedValue({ unreadCount: 3 });
};
