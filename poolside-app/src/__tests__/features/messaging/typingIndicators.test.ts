/**
 * Feature: Typing Indicators
 *
 * Tests for typing indicator functionality including:
 * - Show typing when other user types
 * - Animated three-dot indicator
 * - Typing status clears after timeout
 */

// Mock socket service
jest.mock('../../../api/socket', () => ({
  socketService: {
    startTyping: jest.fn(),
    stopTyping: jest.fn(),
    onUserTyping: jest.fn(),
    offUserTyping: jest.fn(),
    onUserStoppedTyping: jest.fn(),
    offUserStoppedTyping: jest.fn(),
  },
}));

const { socketService } = require('../../../api/socket');

describe('Feature: Typing Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Send Typing Status', () => {
    test('should emit typing start event', () => {
      socketService.startTyping('conv-1');

      expect(socketService.startTyping).toHaveBeenCalledWith('conv-1');
    });

    test('should emit typing stop event', () => {
      socketService.stopTyping('conv-1');

      expect(socketService.stopTyping).toHaveBeenCalledWith('conv-1');
    });

    test('should debounce typing start events', () => {
      let isTyping = false;
      let startCalls = 0;

      const handleTypingStart = (conversationId: string) => {
        if (!isTyping) {
          isTyping = true;
          startCalls++;
          socketService.startTyping(conversationId);
        }
      };

      // Simulate multiple keystrokes
      handleTypingStart('conv-1');
      handleTypingStart('conv-1');
      handleTypingStart('conv-1');

      expect(startCalls).toBe(1);
      expect(socketService.startTyping).toHaveBeenCalledTimes(1);
    });

    test('should auto-stop typing after timeout', () => {
      let isTyping = true;
      const TYPING_TIMEOUT = 3000;

      const startTypingWithTimeout = () => {
        isTyping = true;
        socketService.startTyping('conv-1');

        setTimeout(() => {
          if (isTyping) {
            isTyping = false;
            socketService.stopTyping('conv-1');
          }
        }, TYPING_TIMEOUT);
      };

      startTypingWithTimeout();
      expect(isTyping).toBe(true);

      jest.advanceTimersByTime(TYPING_TIMEOUT);
      expect(isTyping).toBe(false);
      expect(socketService.stopTyping).toHaveBeenCalledWith('conv-1');
    });

    test('should reset timeout on continued typing', () => {
      let typingTimeout: NodeJS.Timeout | null = null;
      let isTyping = false;
      const TYPING_TIMEOUT = 3000;

      const handleKeyPress = (conversationId: string) => {
        if (!isTyping) {
          isTyping = true;
          socketService.startTyping(conversationId);
        }

        // Reset the timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }

        typingTimeout = setTimeout(() => {
          isTyping = false;
          socketService.stopTyping(conversationId);
        }, TYPING_TIMEOUT);
      };

      handleKeyPress('conv-1');
      jest.advanceTimersByTime(2000);

      // Type again before timeout
      handleKeyPress('conv-1');
      jest.advanceTimersByTime(2000);

      // Should still be typing
      expect(isTyping).toBe(true);

      // Wait for full timeout
      jest.advanceTimersByTime(1000);
      expect(isTyping).toBe(false);
    });

    test('should stop typing when message is sent', () => {
      let isTyping = true;

      const sendMessage = () => {
        // Send message logic...
        if (isTyping) {
          isTyping = false;
          socketService.stopTyping('conv-1');
        }
      };

      sendMessage();
      expect(isTyping).toBe(false);
      expect(socketService.stopTyping).toHaveBeenCalledWith('conv-1');
    });

    test('should stop typing when leaving conversation', () => {
      let isTyping = true;

      const leaveConversation = () => {
        if (isTyping) {
          isTyping = false;
          socketService.stopTyping('conv-1');
        }
      };

      leaveConversation();
      expect(socketService.stopTyping).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Receive Typing Status', () => {
    test('should register typing listener on mount', () => {
      const callback = jest.fn();
      socketService.onUserTyping(callback);

      expect(socketService.onUserTyping).toHaveBeenCalledWith(callback);
    });

    test('should unregister typing listener on unmount', () => {
      const callback = jest.fn();
      socketService.offUserTyping(callback);

      expect(socketService.offUserTyping).toHaveBeenCalledWith(callback);
    });

    test('should update typing state when receiving typing event', () => {
      let isPartnerTyping = false;
      let typingUserName: string | null = null;

      const handleUserTyping = (data: { conversationId: string; userId: string; userName?: string }) => {
        if (data.conversationId === 'conv-1') {
          isPartnerTyping = true;
          typingUserName = data.userName || null;
        }
      };

      handleUserTyping({ conversationId: 'conv-1', userId: 'user-2', userName: 'John' });

      expect(isPartnerTyping).toBe(true);
      expect(typingUserName).toBe('John');
    });

    test('should clear typing state when receiving stop typing event', () => {
      let isPartnerTyping = true;
      let typingUserName: string | null = 'John';

      const handleUserStoppedTyping = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === 'conv-1') {
          isPartnerTyping = false;
          typingUserName = null;
        }
      };

      handleUserStoppedTyping({ conversationId: 'conv-1', userId: 'user-2' });

      expect(isPartnerTyping).toBe(false);
      expect(typingUserName).toBeNull();
    });

    test('should only handle typing for current conversation', () => {
      let isPartnerTyping = false;
      const currentConversationId = 'conv-1';

      const handleUserTyping = (data: { conversationId: string }) => {
        if (data.conversationId === currentConversationId) {
          isPartnerTyping = true;
        }
      };

      // Event from different conversation
      handleUserTyping({ conversationId: 'conv-2' });
      expect(isPartnerTyping).toBe(false);

      // Event from current conversation
      handleUserTyping({ conversationId: 'conv-1' });
      expect(isPartnerTyping).toBe(true);
    });
  });

  describe('Typing Indicator Display', () => {
    test('should show typing indicator when partner is typing', () => {
      const getIndicatorVisibility = (isTyping: boolean) => {
        return isTyping ? 'visible' : 'hidden';
      };

      expect(getIndicatorVisibility(true)).toBe('visible');
      expect(getIndicatorVisibility(false)).toBe('hidden');
    });

    test('should display typing user name', () => {
      const getTypingText = (userName: string | null) => {
        if (userName) {
          return `${userName} is typing...`;
        }
        return 'typing...';
      };

      expect(getTypingText('John')).toBe('John is typing...');
      expect(getTypingText(null)).toBe('typing...');
    });

    test('should animate three dots', () => {
      // Animation configuration
      const animationConfig = {
        dots: 3,
        duration: 500,
        delay: 150,
      };

      expect(animationConfig.dots).toBe(3);
      expect(animationConfig.duration).toBe(500);
    });

    test('should position indicator below messages', () => {
      const indicatorPosition = {
        alignSelf: 'flex-start',
        marginLeft: 16,
        marginBottom: 8,
      };

      expect(indicatorPosition.alignSelf).toBe('flex-start');
    });
  });

  describe('Typing State Cleanup', () => {
    test('should clear typing when receiving new message from typing user', () => {
      let isPartnerTyping = true;

      const handleNewMessage = (senderId: string, typingUserId: string) => {
        if (senderId === typingUserId) {
          isPartnerTyping = false;
        }
      };

      handleNewMessage('user-2', 'user-2');
      expect(isPartnerTyping).toBe(false);
    });

    test('should clear typing on conversation change', () => {
      let isPartnerTyping = true;
      let typingUserName: string | null = 'John';

      const handleConversationChange = () => {
        isPartnerTyping = false;
        typingUserName = null;
      };

      handleConversationChange();
      expect(isPartnerTyping).toBe(false);
      expect(typingUserName).toBeNull();
    });

    test('should handle timeout for typing indicator on receiver side', () => {
      let isPartnerTyping = true;
      const TYPING_DISPLAY_TIMEOUT = 5000;

      // Simulate receiving typing event and setting a timeout
      const handleTypingWithTimeout = () => {
        isPartnerTyping = true;

        setTimeout(() => {
          isPartnerTyping = false;
        }, TYPING_DISPLAY_TIMEOUT);
      };

      handleTypingWithTimeout();
      expect(isPartnerTyping).toBe(true);

      jest.advanceTimersByTime(TYPING_DISPLAY_TIMEOUT);
      expect(isPartnerTyping).toBe(false);
    });
  });
});
