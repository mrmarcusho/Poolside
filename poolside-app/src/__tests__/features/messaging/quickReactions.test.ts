/**
 * Feature: Quick Reactions
 *
 * Tests for quick emoji reactions functionality including:
 * - Emoji reaction picker (thumbs up, heart, laugh, fire, party)
 * - Add reaction to message
 * - Display reactions on messages
 */

import { mockMessage } from '../../utils/testUtils';

describe('Feature: Quick Reactions', () => {
  const availableReactions = ['👍', '❤️', '😂', '🔥', '🎉'];
  const currentUserId = 'user-1';

  describe('Reaction Picker', () => {
    test('should have predefined reaction emojis', () => {
      expect(availableReactions).toHaveLength(5);
      expect(availableReactions).toContain('👍');
      expect(availableReactions).toContain('❤️');
      expect(availableReactions).toContain('😂');
      expect(availableReactions).toContain('🔥');
      expect(availableReactions).toContain('🎉');
    });

    test('should show reaction picker on long press', () => {
      let pickerVisible = false;
      let selectedMessageId: string | null = null;

      const handleLongPress = (messageId: string) => {
        pickerVisible = true;
        selectedMessageId = messageId;
      };

      handleLongPress('msg-1');
      expect(pickerVisible).toBe(true);
      expect(selectedMessageId).toBe('msg-1');
    });

    test('should hide picker on selection', () => {
      let pickerVisible = true;

      const handleReactionSelect = (emoji: string) => {
        // Add reaction logic...
        pickerVisible = false;
      };

      handleReactionSelect('👍');
      expect(pickerVisible).toBe(false);
    });

    test('should hide picker on outside tap', () => {
      let pickerVisible = true;

      const handleOutsideTap = () => {
        pickerVisible = false;
      };

      handleOutsideTap();
      expect(pickerVisible).toBe(false);
    });

    test('should position picker near message', () => {
      const getPickerPosition = (messageY: number, isSent: boolean) => {
        return {
          top: messageY - 60, // Above message
          alignSelf: isSent ? 'flex-end' : 'flex-start',
        };
      };

      const position = getPickerPosition(200, true);
      expect(position.top).toBe(140);
      expect(position.alignSelf).toBe('flex-end');
    });
  });

  describe('Add Reaction', () => {
    interface MessageWithReactions {
      id: string;
      text: string;
      senderId: string;
      sentAt: string;
      readAt: string | null;
      reactions: Array<{ emoji: string; userId: string }>;
    }

    test('should add reaction to message', () => {
      let message: MessageWithReactions = { ...mockMessage, reactions: [] };

      const addReaction = (emoji: string, userId: string) => {
        message = {
          ...message,
          reactions: [...message.reactions, { emoji, userId }],
        };
      };

      addReaction('👍', currentUserId);
      expect(message.reactions).toHaveLength(1);
      expect(message.reactions[0].emoji).toBe('👍');
    });

    test('should replace reaction if user already reacted', () => {
      let message: MessageWithReactions = {
        ...mockMessage,
        reactions: [{ emoji: '👍', userId: currentUserId }],
      };

      const addReaction = (emoji: string, userId: string) => {
        // Remove existing reaction from same user
        const filtered = message.reactions.filter(r => r.userId !== userId);
        message = {
          ...message,
          reactions: [...filtered, { emoji, userId }],
        };
      };

      addReaction('❤️', currentUserId);
      expect(message.reactions).toHaveLength(1);
      expect(message.reactions[0].emoji).toBe('❤️');
    });

    test('should allow multiple users to react', () => {
      let message: MessageWithReactions = {
        ...mockMessage,
        reactions: [{ emoji: '👍', userId: 'user-2' }],
      };

      const addReaction = (emoji: string, userId: string) => {
        const hasReaction = message.reactions.some(r => r.userId === userId);
        if (!hasReaction) {
          message = {
            ...message,
            reactions: [...message.reactions, { emoji, userId }],
          };
        }
      };

      addReaction('❤️', currentUserId);
      expect(message.reactions).toHaveLength(2);
    });

    test('should remove reaction if same emoji tapped again', () => {
      let message: MessageWithReactions = {
        ...mockMessage,
        reactions: [{ emoji: '👍', userId: currentUserId }],
      };

      const toggleReaction = (emoji: string, userId: string) => {
        const existingReaction = message.reactions.find(
          r => r.emoji === emoji && r.userId === userId
        );

        if (existingReaction) {
          message = {
            ...message,
            reactions: message.reactions.filter(
              r => !(r.emoji === emoji && r.userId === userId)
            ),
          };
        } else {
          message = {
            ...message,
            reactions: [...message.reactions.filter(r => r.userId !== userId), { emoji, userId }],
          };
        }
      };

      toggleReaction('👍', currentUserId);
      expect(message.reactions).toHaveLength(0);
    });
  });

  describe('Display Reactions', () => {
    interface MessageWithReactions {
      id: string;
      text: string;
      senderId: string;
      sentAt: string;
      readAt: string | null;
      reactions: Array<{ emoji: string; userId: string }>;
    }

    test('should show reactions below message', () => {
      const message: MessageWithReactions = {
        ...mockMessage,
        reactions: [
          { emoji: '👍', userId: 'user-1' },
          { emoji: '👍', userId: 'user-2' },
          { emoji: '❤️', userId: 'user-3' },
        ],
      };

      const hasReactions = message.reactions.length > 0;
      expect(hasReactions).toBe(true);
    });

    test('should group reactions by emoji', () => {
      const reactions = [
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
        { emoji: '❤️', userId: 'user-3' },
      ];

      const groupByEmoji = (reactions: typeof reactions) => {
        const groups: Record<string, string[]> = {};
        reactions.forEach(r => {
          if (!groups[r.emoji]) groups[r.emoji] = [];
          groups[r.emoji].push(r.userId);
        });
        return groups;
      };

      const grouped = groupByEmoji(reactions);
      expect(grouped['👍']).toHaveLength(2);
      expect(grouped['❤️']).toHaveLength(1);
    });

    test('should display reaction count', () => {
      const reactions = [
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
      ];

      const getReactionCount = (reactions: typeof reactions, emoji: string) => {
        return reactions.filter(r => r.emoji === emoji).length;
      };

      expect(getReactionCount(reactions, '👍')).toBe(2);
    });

    test('should format reaction display', () => {
      const formatReaction = (emoji: string, count: number) => {
        return count > 1 ? `${emoji} ${count}` : emoji;
      };

      expect(formatReaction('👍', 1)).toBe('👍');
      expect(formatReaction('👍', 3)).toBe('👍 3');
    });

    test('should highlight user\'s own reaction', () => {
      const reactions = [
        { emoji: '👍', userId: currentUserId },
        { emoji: '👍', userId: 'user-2' },
      ];

      const hasUserReacted = (emoji: string, userId: string) => {
        return reactions.some(r => r.emoji === emoji && r.userId === userId);
      };

      expect(hasUserReacted('👍', currentUserId)).toBe(true);
      expect(hasUserReacted('❤️', currentUserId)).toBe(false);
    });
  });

  describe('Reaction Animations', () => {
    test('should define animation for adding reaction', () => {
      const addReactionAnimation = {
        type: 'spring',
        scale: { from: 0, to: 1.2, final: 1 },
        duration: 300,
      };

      expect(addReactionAnimation.type).toBe('spring');
      expect(addReactionAnimation.scale.from).toBe(0);
    });

    test('should define animation for removing reaction', () => {
      const removeReactionAnimation = {
        type: 'timing',
        scale: { from: 1, to: 0 },
        duration: 200,
      };

      expect(removeReactionAnimation.type).toBe('timing');
      expect(removeReactionAnimation.scale.to).toBe(0);
    });
  });

  describe('Reaction API', () => {
    test('should send reaction to API', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ success: true });

      const addReaction = async (messageId: string, emoji: string) => {
        return mockApiCall(`/messages/${messageId}/reactions`, { emoji });
      };

      const result = await addReaction('msg-1', '👍');
      expect(mockApiCall).toHaveBeenCalledWith('/messages/msg-1/reactions', { emoji: '👍' });
      expect(result.success).toBe(true);
    });

    test('should remove reaction via API', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ success: true });

      const removeReaction = async (messageId: string, emoji: string) => {
        return mockApiCall(`/messages/${messageId}/reactions/${emoji}`, 'DELETE');
      };

      await removeReaction('msg-1', '👍');
      expect(mockApiCall).toHaveBeenCalledWith('/messages/msg-1/reactions/👍', 'DELETE');
    });
  });

  describe('Real-time Reaction Updates', () => {
    test('should receive reaction updates via socket', () => {
      const mockSocketCallback = jest.fn();

      const onReactionAdded = (callback: (data: { messageId: string; emoji: string; userId: string }) => void) => {
        callback({ messageId: 'msg-1', emoji: '👍', userId: 'user-2' });
      };

      onReactionAdded(mockSocketCallback);
      expect(mockSocketCallback).toHaveBeenCalledWith({
        messageId: 'msg-1',
        emoji: '👍',
        userId: 'user-2',
      });
    });

    test('should update message reactions from socket event', () => {
      interface MessageWithReactions {
        id: string;
        text: string;
        senderId: string;
        sentAt: string;
        readAt: string | null;
        reactions: Array<{ emoji: string; userId: string }>;
      }

      let messages: MessageWithReactions[] = [{ ...mockMessage, id: 'msg-1', reactions: [] }];

      const handleReactionEvent = (data: { messageId: string; emoji: string; userId: string }) => {
        messages = messages.map(msg =>
          msg.id === data.messageId
            ? { ...msg, reactions: [...msg.reactions, { emoji: data.emoji, userId: data.userId }] }
            : msg
        );
      };

      handleReactionEvent({ messageId: 'msg-1', emoji: '👍', userId: 'user-2' });
      expect(messages[0].reactions).toHaveLength(1);
    });
  });
});
