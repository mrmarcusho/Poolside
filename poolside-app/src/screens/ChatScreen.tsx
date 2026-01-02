import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSocket, useChat } from '../hooks';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  read?: boolean;
  reactions?: { emoji: string; count: number }[];
  eventCard?: {
    title: string;
    time: string;
    attendees: number;
    emoji: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  emoji: string;
  isOnline: boolean;
}

type ChatRouteParams = {
  Chat: {
    conversation: Conversation;
  };
};

const quickReactions = ['👍', '❤️', '😂', '🔥', '🎉'];

const TypingIndicator: React.FC<{ emoji?: string }> = ({ emoji = '👩‍🦰' }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const getStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.typingBubbleContainer}>
      <View style={styles.typingAvatar}>
        <Text style={styles.typingAvatarEmoji}>{emoji}</Text>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDotsContainer}>
          <Animated.View style={[styles.typingDot, getStyle(dot1)]} />
          <Animated.View style={[styles.typingDot, getStyle(dot2)]} />
          <Animated.View style={[styles.typingDot, getStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
};

const MessageBubble: React.FC<{ message: Message; isFirst: boolean; isLast: boolean }> = ({
  message,
  isFirst,
  isLast,
}) => {
  if (message.eventCard) {
    return (
      <View style={styles.eventCardContainer}>
        <View style={styles.eventCard}>
          <View style={styles.eventCardImage}>
            <Text style={styles.eventCardEmoji}>{message.eventCard.emoji}</Text>
          </View>
          <View style={styles.eventCardContent}>
            <Text style={styles.eventCardTitle}>{message.eventCard.title}</Text>
            <Text style={styles.eventCardMeta}>
              {message.eventCard.time} • {message.eventCard.attendees} going
            </Text>
            <TouchableOpacity style={styles.eventCardBtn}>
              <Text style={styles.eventCardBtnText}>View Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageBubble,
        message.sent ? styles.messageBubbleSent : styles.messageBubbleReceived,
        isFirst && (message.sent ? styles.messageBubbleSentFirst : styles.messageBubbleReceivedFirst),
        isLast && (message.sent ? styles.messageBubbleSentLast : styles.messageBubbleReceivedLast),
      ]}
    >
      <Text style={styles.messageText}>{message.text}</Text>
    </View>
  );
};

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const { user } = useAuth();
  const { isConnected, connect } = useSocket();

  const conversation = route.params?.conversation || {
    id: '1',
    name: 'Sarah Johnson',
    emoji: '👩‍🦰',
    isOnline: true,
  };

  const {
    messages: chatMessages,
    isLoading,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  } = useChat({
    conversationId: conversation.id,
    isSocketConnected: isConnected,
  });

  const [messageText, setMessageText] = useState('');

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (isConnected && chatMessages.length > 0) {
      markAsRead();
    }
  }, [isConnected, chatMessages.length, markAsRead]);

  // Transform API messages to UI format
  const messages: Message[] = chatMessages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    sent: msg.senderId === user?.id,
    time: new Date(msg.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    read: !!msg.readAt,
  }));

  // Group consecutive messages by sender
  const groupedMessages: { messages: Message[]; sent: boolean }[] = [];
  messages.forEach((msg) => {
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.sent === msg.sent) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ messages: [msg], sent: msg.sent });
    }
  });

  // Handle text input change with typing indicator
  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    if (text.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessage(messageText.trim());
    setMessageText('');
    stopTyping();

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a12', '#0d0d1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <BlurView intensity={40} tint="dark" style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.chatUserInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarEmoji}>{conversation.emoji}</Text>
              {conversation.isOnline && <View style={styles.chatOnlineDot} />}
            </View>
            <View style={styles.chatUserDetails}>
              <Text style={styles.chatUserName}>{conversation.name}</Text>
              <Text style={styles.chatUserStatus}>
                {conversation.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn}>
              <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </BlurView>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesArea}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
              </View>
            )}

            {/* Date Divider */}
            {!isLoading && messages.length > 0 && (
              <View style={styles.dateDivider}>
                <View style={styles.dateDividerPill}>
                  <Text style={styles.dateDividerText}>Today</Text>
                </View>
              </View>
            )}

            {/* Message Groups */}
            {!isLoading && groupedMessages.map((group, groupIndex) => (
              <View
                key={groupIndex}
                style={[styles.messageGroup, group.sent ? styles.messageGroupSent : styles.messageGroupReceived]}
              >
                {group.messages.map((message, msgIndex) => (
                  <View key={message.id}>
                    <MessageBubble
                      message={message}
                      isFirst={msgIndex === 0}
                      isLast={msgIndex === group.messages.length - 1}
                    />
                    {message.reactions && (
                      <View style={[styles.messageReactions, group.sent && styles.messageReactionsSent]}>
                        {message.reactions.map((reaction, idx) => (
                          <View key={idx} style={styles.reactionBadge}>
                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                            <Text style={styles.reactionCount}>{reaction.count}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                <Text style={[styles.messageTimestamp, group.sent && styles.messageTimestampSent]}>
                  {group.messages[group.messages.length - 1].time}
                </Text>
                {group.sent && group.messages[group.messages.length - 1].read && (
                  <View style={styles.readReceipt}>
                    <Ionicons name="checkmark-done" size={14} color="#667eea" />
                    <Text style={styles.readReceiptText}>Read</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator emoji={conversation.emoji} />}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Quick Reactions */}
          <View style={styles.quickReactions}>
            {quickReactions.map((emoji) => (
              <TouchableOpacity key={emoji} style={styles.reactionChip}>
                <Text style={styles.reactionChipEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Area */}
          <BlurView intensity={40} tint="dark" style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachmentBtn}>
                <Ionicons name="attach" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              <View style={styles.messageInputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Message..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={messageText}
                  onChangeText={handleTextChange}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity style={styles.emojiBtn}>
                  <Text style={styles.emojiBtnText}>😊</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!messageText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarEmoji: {
    fontSize: 22,
  },
  chatOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  chatUserDetails: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  chatUserStatus: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateDivider: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateDividerPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  dateDividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  messageGroup: {
    marginBottom: 8,
  },
  messageGroupSent: {
    alignItems: 'flex-end',
  },
  messageGroupReceived: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 1,
  },
  messageBubbleSent: {
    backgroundColor: 'rgba(102, 126, 234, 0.85)',
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageBubbleSentFirst: {
    borderTopRightRadius: 20,
  },
  messageBubbleSentLast: {
    borderBottomRightRadius: 20,
  },
  messageBubbleReceived: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageBubbleReceivedFirst: {
    borderTopLeftRadius: 20,
  },
  messageBubbleReceivedLast: {
    borderBottomLeftRadius: 20,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
  },
  messageTimestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  messageTimestampSent: {
    textAlign: 'right',
  },
  messageReactions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  messageReactionsSent: {
    justifyContent: 'flex-end',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  readReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  readReceiptText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  eventCardContainer: {
    marginVertical: 4,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 260,
  },
  eventCardImage: {
    height: 100,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventCardEmoji: {
    fontSize: 40,
  },
  eventCardContent: {
    padding: 14,
  },
  eventCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventCardMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  eventCardBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 10,
    alignItems: 'center',
  },
  eventCardBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  typingBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingAvatarEmoji: {
    fontSize: 16,
  },
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  quickReactions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reactionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
  },
  reactionChipEmoji: {
    fontSize: 16,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  attachmentBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
  },
  emojiBtn: {
    opacity: 0.6,
  },
  emojiBtnText: {
    fontSize: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
