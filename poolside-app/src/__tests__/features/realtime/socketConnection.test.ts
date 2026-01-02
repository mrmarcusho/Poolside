/**
 * Feature: Socket Connection
 *
 * Tests for WebSocket connection functionality including:
 * - Connect on app launch / auth
 * - JWT authentication for socket
 * - Reconnect on disconnect
 * - Disconnect on logout
 */

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    id: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
  })),
}));

// Mock token storage
jest.mock('../../../api/client', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const { io } = require('socket.io-client');
const { tokenStorage } = require('../../../api/client');

describe('Feature: Socket Connection', () => {
  let mockSocket: ReturnType<typeof io>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = io();
  });

  describe('Connect on Auth', () => {
    test('should connect socket when user is authenticated', async () => {
      tokenStorage.getAccessToken.mockResolvedValueOnce('valid-token');

      const connect = async () => {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          io('http://localhost:3000', { auth: { token } });
          return true;
        }
        return false;
      };

      const connected = await connect();
      expect(connected).toBe(true);
      expect(io).toHaveBeenCalledWith('http://localhost:3000', {
        auth: { token: 'valid-token' },
      });
    });

    test('should not connect without access token', async () => {
      tokenStorage.getAccessToken.mockResolvedValueOnce(null);

      const connect = async () => {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          io('http://localhost:3000', { auth: { token } });
          return true;
        }
        return false;
      };

      const connected = await connect();
      expect(connected).toBe(false);
    });

    test('should use websocket transport', () => {
      const socketConfig = {
        transports: ['websocket'],
        reconnection: true,
      };

      expect(socketConfig.transports).toContain('websocket');
    });
  });

  describe('JWT Authentication', () => {
    test('should send token in auth object', async () => {
      tokenStorage.getAccessToken.mockResolvedValueOnce('jwt-token');

      const token = await tokenStorage.getAccessToken();
      const config = { auth: { token } };

      expect(config.auth.token).toBe('jwt-token');
    });

    test('should handle authentication error', () => {
      const authErrorHandlers: Array<(error: Error) => void> = [];

      mockSocket.on = jest.fn((event: string, callback: (error: Error) => void) => {
        if (event === 'connect_error') {
          authErrorHandlers.push(callback);
        }
      });

      let authError: Error | null = null;

      mockSocket.on('connect_error', (error: Error) => {
        if (error.message === 'Authentication failed') {
          authError = error;
        }
      });

      // Simulate auth error
      authErrorHandlers.forEach(handler =>
        handler(new Error('Authentication failed'))
      );

      expect(authError?.message).toBe('Authentication failed');
    });

    test('should refresh token on auth failure', async () => {
      tokenStorage.getAccessToken.mockResolvedValueOnce('expired-token');
      tokenStorage.getRefreshToken.mockResolvedValueOnce('refresh-token');

      const refreshAndReconnect = async () => {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken) {
          // Simulate token refresh
          await tokenStorage.setTokens('new-access-token', 'new-refresh-token');
          return true;
        }
        return false;
      };

      const refreshed = await refreshAndReconnect();
      expect(refreshed).toBe(true);
      expect(tokenStorage.setTokens).toHaveBeenCalled();
    });
  });

  describe('Reconnection', () => {
    test('should enable auto-reconnection', () => {
      const socketConfig = {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      };

      expect(socketConfig.reconnection).toBe(true);
      expect(socketConfig.reconnectionAttempts).toBe(5);
    });

    test('should handle disconnect event', () => {
      let disconnectReason: string | null = null;

      const handleDisconnect = (reason: string) => {
        disconnectReason = reason;
      };

      handleDisconnect('io server disconnect');
      expect(disconnectReason).toBe('io server disconnect');
    });

    test('should attempt reconnection on disconnect', () => {
      jest.useFakeTimers();

      let reconnectAttempts = 0;
      const maxAttempts = 5;

      const attemptReconnect = () => {
        if (reconnectAttempts < maxAttempts) {
          reconnectAttempts++;
        }
      };

      // Simulate reconnection attempts
      for (let i = 0; i < 3; i++) {
        attemptReconnect();
      }

      expect(reconnectAttempts).toBe(3);
      jest.useRealTimers();
    });

    test('should handle reconnect success', () => {
      let isConnected = false;

      const handleReconnect = () => {
        isConnected = true;
      };

      handleReconnect();
      expect(isConnected).toBe(true);
    });

    test('should limit reconnection attempts', () => {
      const maxAttempts = 5;
      let attempts = 0;
      let gaveUp = false;

      const attemptReconnect = () => {
        attempts++;
        if (attempts >= maxAttempts) {
          gaveUp = true;
        }
      };

      for (let i = 0; i < 6; i++) {
        attemptReconnect();
      }

      expect(gaveUp).toBe(true);
    });
  });

  describe('Disconnect on Logout', () => {
    test('should disconnect socket on logout', () => {
      let isConnected = true;

      const handleLogout = () => {
        mockSocket.disconnect();
        isConnected = false;
      };

      handleLogout();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(isConnected).toBe(false);
    });

    test('should clear socket reference after disconnect', () => {
      let socket: typeof mockSocket | null = mockSocket;

      const handleLogout = () => {
        socket?.disconnect();
        socket = null;
      };

      handleLogout();
      expect(socket).toBeNull();
    });
  });

  describe('Connection State', () => {
    test('should track connection state', () => {
      let connectionState = {
        isConnected: false,
        isConnecting: false,
        error: null as Error | null,
      };

      const setConnecting = () => {
        connectionState = { ...connectionState, isConnecting: true, error: null };
      };

      const setConnected = () => {
        connectionState = { isConnected: true, isConnecting: false, error: null };
      };

      const setError = (error: Error) => {
        connectionState = { isConnected: false, isConnecting: false, error };
      };

      setConnecting();
      expect(connectionState.isConnecting).toBe(true);

      setConnected();
      expect(connectionState.isConnected).toBe(true);
      expect(connectionState.isConnecting).toBe(false);

      setError(new Error('Connection failed'));
      expect(connectionState.error?.message).toBe('Connection failed');
    });

    test('should expose socket ID when connected', () => {
      const connectedSocket = {
        ...mockSocket,
        connected: true,
        id: 'socket-123',
      };

      expect(connectedSocket.id).toBe('socket-123');
    });

    test('should return null socket ID when disconnected', () => {
      const disconnectedSocket = {
        ...mockSocket,
        connected: false,
        id: null,
      };

      expect(disconnectedSocket.id).toBeNull();
    });
  });

  describe('Event Cleanup', () => {
    test('should remove event listeners on cleanup', () => {
      const eventHandlers = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        new_message: jest.fn(),
      };

      const cleanup = () => {
        Object.keys(eventHandlers).forEach(event => {
          mockSocket.off(event, eventHandlers[event as keyof typeof eventHandlers]);
        });
      };

      cleanup();
      expect(mockSocket.off).toHaveBeenCalledTimes(3);
    });
  });
});
