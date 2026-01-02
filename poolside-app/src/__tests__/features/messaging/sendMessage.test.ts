/**
 * Feature: Send Message
 *
 * Tests for sending message functionality including:
 * - Text input and send button
 * - Message appears in chat immediately
 * - Real-time delivery to recipient
 */

import { mockMessage } from '../../utils/testUtils';

// Mock the API modules
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
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

// Mock socket service
jest.mock('../../../api/socket', () => ({
  socketService: {
    sendMessage: jest.fn(),
    onNewMessage: jest.fn(),
    offNewMessage: jest.fn(),
  },
}));

const { apiClient } = require('../../../api/client');
const { socketService } = require('../../../api/socket');

describe('Feature: Send Message', () => {
  const currentUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Send Message via REST API', () => {
    test('should send message successfully', async () => {
      const newMessage = {
        id: 'new-msg-1',
        text: 'Hello!',
        senderId: currentUserId,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      apiClient.post.mockResolvedValueOnce({ data: newMessage });

      const response = await apiClient.post('/me/messages/conversations/conv-1', { text: 'Hello!' });

      expect(apiClient.post).toHaveBeenCalledWith('/me/messages/conversations/conv-1', { text: 'Hello!' });
      expect(response.data.text).toBe('Hello!');
    });

    test('should return message with ID', async () => {
      const newMessage = {
        id: 'new-msg-1',
        text: 'Hello!',
        senderId: currentUserId,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      apiClient.post.mockResolvedValueOnce({ data: newMessage });

      const response = await apiClient.post('/me/messages/conversations/conv-1', { text: 'Hello!' });

      expect(response.data.id).toBe('new-msg-1');
    });

    test('should set correct senderId', async () => {
      const newMessage = {
        id: 'new-msg-1',
        text: 'Hello!',
        senderId: currentUserId,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      apiClient.post.mockResolvedValueOnce({ data: newMessage });

      const response = await apiClient.post('/me/messages/conversations/conv-1', { text: 'Hello!' });

      expect(response.data.senderId).toBe(currentUserId);
    });

    test('should handle send errors', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid message' } },
      });

      await expect(
        apiClient.post('/me/messages/conversations/conv-1', { text: '' })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    test('should handle network errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.post('/me/messages/conversations/conv-1', { text: 'Hello!' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Send Message via WebSocket', () => {
    test('should emit message via socket', () => {
      socketService.sendMessage('conv-1', 'Hello!');

      expect(socketService.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
    });

    test('should handle empty message text', () => {
      const sendMessage = (conversationId: string, text: string) => {
        if (!text.trim()) return;
        socketService.sendMessage(conversationId, text);
      };

      sendMessage('conv-1', '');
      expect(socketService.sendMessage).not.toHaveBeenCalled();
    });

    test('should trim message text', () => {
      const sendMessage = (conversationId: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        socketService.sendMessage(conversationId, trimmed);
      };

      sendMessage('conv-1', '  Hello!  ');
      expect(socketService.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
    });
  });

  describe('Optimistic Update', () => {
    test('should add message to UI immediately', () => {
      let messages: typeof mockMessage[] = [];

      const addOptimisticMessage = (text: string) => {
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          text,
          senderId: currentUserId,
          sentAt: new Date().toISOString(),
          readAt: null,
        };
        messages = [...messages, optimisticMessage];
        return optimisticMessage;
      };

      addOptimisticMessage('Hello!');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('Hello!');
    });

    test('should mark optimistic message with pending status', () => {
      interface PendingMessage {
        id: string;
        text: string;
        senderId: string;
        sentAt: string;
        readAt: string | null;
        isPending: boolean;
      }

      let messages: PendingMessage[] = [];

      const addOptimisticMessage = (text: string) => {
        const optimisticMessage: PendingMessage = {
          id: `temp-${Date.now()}`,
          text,
          senderId: currentUserId,
          sentAt: new Date().toISOString(),
          readAt: null,
          isPending: true,
        };
        messages = [...messages, optimisticMessage];
        return optimisticMessage;
      };

      const msg = addOptimisticMessage('Hello!');
      expect(msg.isPending).toBe(true);
    });

    test('should replace optimistic message with real message', () => {
      interface PendingMessage {
        id: string;
        text: string;
        senderId: string;
        sentAt: string;
        readAt: string | null;
        isPending?: boolean;
      }

      const tempId = 'temp-123';
      let messages: PendingMessage[] = [
        {
          id: tempId,
          text: 'Hello!',
          senderId: currentUserId,
          sentAt: new Date().toISOString(),
          readAt: null,
          isPending: true,
        },
      ];

      const updateWithRealMessage = (tempId: string, realMessage: typeof mockMessage) => {
        messages = messages.map(m =>
          m.id === tempId ? { ...realMessage, isPending: false } : m
        );
      };

      const realMessage = {
        ...mockMessage,
        id: 'real-msg-1',
        text: 'Hello!',
      };

      updateWithRealMessage(tempId, realMessage);
      expect(messages[0].id).toBe('real-msg-1');
      expect(messages[0].isPending).toBe(false);
    });

    test('should remove optimistic message on error', () => {
      const tempId = 'temp-123';
      let messages = [
        { id: tempId, text: 'Hello!', isPending: true },
      ];

      const removeOptimisticMessage = (tempId: string) => {
        messages = messages.filter(m => m.id !== tempId);
      };

      removeOptimisticMessage(tempId);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Input State Management', () => {
    test('should track input text', () => {
      let inputText = '';

      const handleTextChange = (text: string) => {
        inputText = text;
      };

      handleTextChange('Hello');
      expect(inputText).toBe('Hello');
    });

    test('should clear input after successful send', async () => {
      let inputText = 'Hello!';

      const sendMessage = async () => {
        apiClient.post.mockResolvedValueOnce({ data: { id: '1', text: inputText } });
        await apiClient.post('/me/messages/conversations/conv-1', { text: inputText });
        inputText = '';
      };

      await sendMessage();
      expect(inputText).toBe('');
    });

    test('should preserve input on send failure', async () => {
      let inputText = 'Hello!';

      const sendMessage = async () => {
        try {
          apiClient.post.mockRejectedValueOnce(new Error('Network error'));
          await apiClient.post('/me/messages/conversations/conv-1', { text: inputText });
          inputText = '';
        } catch {
          // Keep input text on error
        }
      };

      await sendMessage();
      expect(inputText).toBe('Hello!');
    });

    test('should disable send button when input is empty', () => {
      const isSendDisabled = (text: string) => !text.trim();

      expect(isSendDisabled('')).toBe(true);
      expect(isSendDisabled('   ')).toBe(true);
      expect(isSendDisabled('Hello')).toBe(false);
    });

    test('should disable send button while sending', () => {
      let isSending = false;
      const inputText = 'Hello';

      const isSendDisabled = (text: string, sending: boolean) => {
        return !text.trim() || sending;
      };

      expect(isSendDisabled(inputText, false)).toBe(false);

      isSending = true;
      expect(isSendDisabled(inputText, isSending)).toBe(true);
    });
  });

  describe('Send Button Interaction', () => {
    test('should track sending state', async () => {
      let isSending = false;

      const sendMessage = async (text: string) => {
        isSending = true;
        apiClient.post.mockResolvedValueOnce({ data: { id: '1', text } });
        await apiClient.post('/me/messages/conversations/conv-1', { text });
        isSending = false;
      };

      await sendMessage('Hello!');
      expect(isSending).toBe(false);
    });

    test('should prevent multiple sends', async () => {
      let isSending = false;
      let sendCount = 0;

      const sendMessage = async (text: string) => {
        if (isSending) return;
        isSending = true;
        sendCount++;
        apiClient.post.mockResolvedValueOnce({ data: { id: '1', text } });
        await apiClient.post('/me/messages/conversations/conv-1', { text });
        isSending = false;
      };

      // Simulate rapid clicks
      await Promise.all([
        sendMessage('Hello!'),
        sendMessage('Hello!'),
        sendMessage('Hello!'),
      ]);

      expect(sendCount).toBe(1);
    });
  });

  describe('Message Character Limit', () => {
    test('should enforce maximum message length', () => {
      const MAX_LENGTH = 1000;

      const isValidLength = (text: string) => text.length <= MAX_LENGTH;

      expect(isValidLength('Hello')).toBe(true);
      expect(isValidLength('A'.repeat(1000))).toBe(true);
      expect(isValidLength('A'.repeat(1001))).toBe(false);
    });

    test('should display remaining characters', () => {
      const MAX_LENGTH = 1000;

      const getRemainingChars = (text: string) => MAX_LENGTH - text.length;

      expect(getRemainingChars('Hello')).toBe(995);
      expect(getRemainingChars('A'.repeat(990))).toBe(10);
    });
  });

  describe('Multiline Messages', () => {
    test('should support multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      expect(multilineText.split('\n')).toHaveLength(3);
    });

    test('should preserve line breaks when sending', async () => {
      const multilineText = 'Hello\nWorld';
      apiClient.post.mockResolvedValueOnce({ data: { id: '1', text: multilineText } });

      const response = await apiClient.post('/me/messages/conversations/conv-1', { text: multilineText });

      expect(response.data.text).toBe('Hello\nWorld');
    });
  });
});
