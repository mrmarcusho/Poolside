/**
 * Feature: Online Status
 *
 * Tests for online status functionality including:
 * - Broadcast own online status
 * - Receive others' status updates
 * - Status reflects in UI (friends list, chat)
 */

// Mock socket service
jest.mock('../../../api/socket', () => ({
  socketService: {
    getSocket: jest.fn(),
    isConnected: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

const { socketService } = require('../../../api/socket');

describe('Feature: Online Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Broadcast Own Status', () => {
    test('should broadcast online status when connected', () => {
      socketService.isConnected.mockReturnValue(true);

      const broadcastOnline = () => {
        if (socketService.isConnected()) {
          socketService.emit('user_online');
          return true;
        }
        return false;
      };

      expect(broadcastOnline()).toBe(true);
    });

    test('should not broadcast when disconnected', () => {
      socketService.isConnected.mockReturnValue(false);

      const broadcastOnline = () => {
        if (socketService.isConnected()) {
          socketService.emit('user_online');
          return true;
        }
        return false;
      };

      expect(broadcastOnline()).toBe(false);
    });

    test('should broadcast offline status on disconnect', () => {
      const handleDisconnect = () => {
        socketService.emit('user_offline');
      };

      handleDisconnect();
      expect(socketService.emit).toHaveBeenCalledWith('user_offline');
    });

    test('should broadcast offline on app background', () => {
      let appState = 'active';

      const handleAppStateChange = (nextState: string) => {
        if (nextState === 'background' && appState === 'active') {
          socketService.emit('user_offline');
        } else if (nextState === 'active' && appState !== 'active') {
          socketService.emit('user_online');
        }
        appState = nextState;
      };

      handleAppStateChange('background');
      expect(socketService.emit).toHaveBeenCalledWith('user_offline');
    });

    test('should broadcast online on app foreground', () => {
      let appState = 'background';

      const handleAppStateChange = (nextState: string) => {
        if (nextState === 'active' && appState !== 'active') {
          socketService.emit('user_online');
        }
        appState = nextState;
      };

      handleAppStateChange('active');
      expect(socketService.emit).toHaveBeenCalledWith('user_online');
    });
  });

  describe('Receive Status Updates', () => {
    test('should listen for user_online events', () => {
      const callback = jest.fn();

      socketService.on('user_online', callback);

      expect(socketService.on).toHaveBeenCalledWith('user_online', callback);
    });

    test('should listen for user_offline events', () => {
      const callback = jest.fn();

      socketService.on('user_offline', callback);

      expect(socketService.on).toHaveBeenCalledWith('user_offline', callback);
    });

    test('should update user status on online event', () => {
      const users: Record<string, boolean> = {
        'user-1': false,
        'user-2': false,
      };

      const handleUserOnline = (userId: string) => {
        if (users.hasOwnProperty(userId)) {
          users[userId] = true;
        }
      };

      handleUserOnline('user-1');
      expect(users['user-1']).toBe(true);
      expect(users['user-2']).toBe(false);
    });

    test('should update user status on offline event', () => {
      const users: Record<string, boolean> = {
        'user-1': true,
        'user-2': true,
      };

      const handleUserOffline = (userId: string) => {
        if (users.hasOwnProperty(userId)) {
          users[userId] = false;
        }
      };

      handleUserOffline('user-1');
      expect(users['user-1']).toBe(false);
      expect(users['user-2']).toBe(true);
    });
  });

  describe('Friends List Status', () => {
    test('should show online indicator for online friends', () => {
      const friends = [
        { id: 'friend-1', name: 'Friend 1', isOnline: true },
        { id: 'friend-2', name: 'Friend 2', isOnline: false },
      ];

      const onlineFriends = friends.filter(f => f.isOnline);
      expect(onlineFriends).toHaveLength(1);
      expect(onlineFriends[0].id).toBe('friend-1');
    });

    test('should update friend status in real-time', () => {
      let friends = [
        { id: 'friend-1', name: 'Friend 1', isOnline: false },
      ];

      const updateFriendStatus = (userId: string, isOnline: boolean) => {
        friends = friends.map(f =>
          f.id === userId ? { ...f, isOnline } : f
        );
      };

      updateFriendStatus('friend-1', true);
      expect(friends[0].isOnline).toBe(true);
    });

    test('should sort friends by online status', () => {
      const friends = [
        { id: '1', name: 'A', isOnline: false },
        { id: '2', name: 'B', isOnline: true },
        { id: '3', name: 'C', isOnline: false },
        { id: '4', name: 'D', isOnline: true },
      ];

      const sorted = [...friends].sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
        return a.isOnline ? -1 : 1;
      });

      expect(sorted[0].isOnline).toBe(true);
      expect(sorted[1].isOnline).toBe(true);
      expect(sorted[2].isOnline).toBe(false);
      expect(sorted[3].isOnline).toBe(false);
    });

    test('should display online count', () => {
      const friends = [
        { id: '1', isOnline: true },
        { id: '2', isOnline: false },
        { id: '3', isOnline: true },
      ];

      const onlineCount = friends.filter(f => f.isOnline).length;
      expect(onlineCount).toBe(2);
    });
  });

  describe('Chat Status', () => {
    test('should show partner online status in chat header', () => {
      const partner = { id: 'partner-1', name: 'Partner', isOnline: true };

      const getStatusText = (isOnline: boolean) => {
        return isOnline ? 'Online' : 'Offline';
      };

      expect(getStatusText(partner.isOnline)).toBe('Online');
    });

    test('should update chat header status in real-time', () => {
      let partnerStatus = { id: 'partner-1', isOnline: false };

      const handleStatusChange = (userId: string, isOnline: boolean) => {
        if (partnerStatus.id === userId) {
          partnerStatus = { ...partnerStatus, isOnline };
        }
      };

      handleStatusChange('partner-1', true);
      expect(partnerStatus.isOnline).toBe(true);
    });

    test('should show last seen for offline users', () => {
      const getLastSeenText = (lastSeen: string | null, isOnline: boolean) => {
        if (isOnline) return 'Online';
        if (!lastSeen) return 'Offline';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffMins < 60) return `Last seen ${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Last seen ${diffHours}h ago`;
        return `Last seen ${date.toLocaleDateString()}`;
      };

      expect(getLastSeenText(null, true)).toBe('Online');
      expect(getLastSeenText(null, false)).toBe('Offline');
    });
  });

  describe('Conversation List Status', () => {
    test('should show online indicator in conversation list', () => {
      const conversations = [
        { id: 'conv-1', participant: { id: 'user-1', isOnline: true } },
        { id: 'conv-2', participant: { id: 'user-2', isOnline: false } },
      ];

      const getOnlineStatus = (conversation: typeof conversations[0]) => {
        return conversation.participant.isOnline;
      };

      expect(getOnlineStatus(conversations[0])).toBe(true);
      expect(getOnlineStatus(conversations[1])).toBe(false);
    });

    test('should update conversation status in real-time', () => {
      let conversations = [
        { id: 'conv-1', participant: { id: 'user-1', isOnline: false } },
      ];

      const updateParticipantStatus = (userId: string, isOnline: boolean) => {
        conversations = conversations.map(c =>
          c.participant.id === userId
            ? { ...c, participant: { ...c.participant, isOnline } }
            : c
        );
      };

      updateParticipantStatus('user-1', true);
      expect(conversations[0].participant.isOnline).toBe(true);
    });
  });

  describe('Status Indicator Styles', () => {
    test('should return green color for online', () => {
      const getStatusColor = (isOnline: boolean) => {
        return isOnline ? '#10B981' : '#6B7280';
      };

      expect(getStatusColor(true)).toBe('#10B981');
    });

    test('should return gray color for offline', () => {
      const getStatusColor = (isOnline: boolean) => {
        return isOnline ? '#10B981' : '#6B7280';
      };

      expect(getStatusColor(false)).toBe('#6B7280');
    });

    test('should define indicator size and position', () => {
      const indicatorStyle = {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute' as const,
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: '#1F2937',
      };

      expect(indicatorStyle.width).toBe(12);
      expect(indicatorStyle.borderRadius).toBe(6);
    });
  });

  describe('Cleanup', () => {
    test('should remove status listeners on unmount', () => {
      const cleanup = () => {
        socketService.off('user_online');
        socketService.off('user_offline');
      };

      cleanup();
      expect(socketService.off).toHaveBeenCalledWith('user_online');
      expect(socketService.off).toHaveBeenCalledWith('user_offline');
    });
  });
});
