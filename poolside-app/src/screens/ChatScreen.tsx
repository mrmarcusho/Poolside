import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

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

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hey! Are you coming to the pool party later? 🏊‍♀️',
    sent: false,
    time: '2:30 PM',
  },
  {
    id: '2',
    text: "Yes! I'm so excited! What time does it start?",
    sent: true,
    time: '2:32 PM',
  },
  {
    id: '3',
    text: 'It starts at 4pm on Deck 7',
    sent: false,
    time: '2:33 PM',
  },
  {
    id: '4',
    text: "I heard they're having a DJ and free cocktails!",
    sent: false,
    time: '2:33 PM',
  },
  {
    id: '5',
    text: 'That sounds amazing! Should I bring anything?',
    sent: true,
    time: '2:35 PM',
  },
  {
    id: '6',
    text: 'Just your swimsuit and good vibes! 😎',
    sent: false,
    time: '2:36 PM',
    reactions: [{ emoji: '🔥', count: 2 }],
  },
  {
    id: '7',
    text: '',
    sent: false,
    time: '2:36 PM',
    eventCard: {
      title: 'Pool Party at Deck 7',
      time: 'Today at 4:00 PM',
      attendees: 28,
      emoji: '🎉',
    },
  },
  {
    id: '8',
    text: 'Perfect! See you there!',
    sent: true,
    time: '2:38 PM',
    read: true,
  },
];

const quickReactions = ['👍', '❤️', '😂', '🔥', '🎉'];

const TypingIndicator: React.FC = () => {
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
        <Text style={styles.typingAvatarEmoji}>👩‍🦰</Text>
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

  const conversation = route.params?.conversation || {
    id: '1',
    name: 'Sarah Johnson',
    emoji: '👩‍🦰',
    isOnline: true,
  };

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(true);

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

  const handleSend = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');

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
            {/* Date Divider */}
            <View style={styles.dateDivider}>
              <View style={styles.dateDividerPill}>
                <Text style={styles.dateDividerText}>Today</Text>
              </View>
            </View>

            {/* Message Groups */}
            {groupedMessages.map((group, groupIndex) => (
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
            {isTyping && <TypingIndicator />}

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
                  onChangeText={setMessageText}
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
