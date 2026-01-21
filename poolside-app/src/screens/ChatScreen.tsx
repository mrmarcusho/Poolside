import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardGestureArea,
  KeyboardStickyView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Reanimated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  SlideInLeft,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView);
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSocket, useChat, useEventChat } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { ProfileBackground } from '../components';
import { uploadsService } from '../api/services/uploads';
import { eventChatService } from '../api/services/eventChat';
import { Image } from 'react-native';

// Mascot image for empty event chat state
const MascotImage = require('../assets/images/mascot-dj-elephant.png');
// Event chat background image (same as feed)
const EventChatBackground = require('../assets/images/feed-background.png');
import { ReplyTo, EventChatMessage, MessageRepliesResponse } from '../api/socket';

interface Message {
  id: string;
  text: string;
  imageUrl?: string | null;
  sent: boolean;
  time: string;
  read?: boolean;
  senderName?: string;
  senderEmoji?: string;
  senderId?: string;
  reactions?: { emoji: string; count: number }[];
  replyTo?: ReplyTo | null;
  replyCount?: number;
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
  isEventChat?: boolean;
  eventImage?: string;
}

type ChatRouteParams = {
  Chat: {
    conversation: Conversation;
  };
};

const quickReactions = ['👍', '❤️', '😂', '🔥', '🎉'];

const TypingIndicator: React.FC<{ emoji?: string; userName?: string | null }> = ({ emoji = '👩‍🦰', userName }) => {
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
      <View>
        {userName && <Text style={styles.typingUserName}>{userName}</Text>}
        <View style={styles.typingBubble}>
          <View style={styles.typingDotsContainer}>
            <Animated.View style={[styles.typingDot, getStyle(dot1)]} />
            <Animated.View style={[styles.typingDot, getStyle(dot2)]} />
            <Animated.View style={[styles.typingDot, getStyle(dot3)]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Animated wrapper for sent messages
const AnimatedMessageBubble: React.FC<{
  children: React.ReactNode;
  isNew: boolean;
  isSent: boolean;
  hasImage?: boolean;
}> = ({ children, isNew, isSent, hasImage }) => {
  const translateY = useRef(new Animated.Value(isNew && isSent ? 30 : 0)).current;
  const scale = useRef(new Animated.Value(isNew && isSent ? 0.85 : 1)).current;
  const opacity = useRef(new Animated.Value(isNew && isSent ? 0.9 : 1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew && isSent) {
      // Spring animation for slide up + scale
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow effect on landing (skip for image messages)
      if (!hasImage) {
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, []);

  if (!isSent) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY }, { scale }],
        opacity,
        maxWidth: '100%',
      }}
    >
      {children}
      {/* Glow overlay (skip for image messages) */}
      {!hasImage && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
            backgroundColor: 'rgba(102, 126, 234, 0.3)',
            opacity: glowOpacity,
          }}
          pointerEvents="none"
        />
      )}
    </Animated.View>
  );
};

// Swipeable message wrapper for reply gesture
const SwipeableMessage: React.FC<{
  children: React.ReactNode;
  onReply: () => void;
  enabled?: boolean;
}> = ({ children, onReply, enabled = true }) => {
  const translateX = useSharedValue(0);
  const hasTriggered = useSharedValue(false);
  const SWIPE_THRESHOLD = 60;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  };

  const triggerReply = () => {
    onReply();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .onUpdate((event) => {
      // Only allow swiping right
      if (event.translationX > 0 && enabled) {
        translateX.value = Math.min(event.translationX, 100);

        // Trigger haptic when crossing threshold
        if (translateX.value >= SWIPE_THRESHOLD && !hasTriggered.value) {
          hasTriggered.value = true;
          runOnJS(triggerHaptic)();
        } else if (translateX.value < SWIPE_THRESHOLD) {
          hasTriggered.value = false;
        }
      }
    })
    .onEnd(() => {
      if (translateX.value >= SWIPE_THRESHOLD) {
        runOnJS(triggerReply)();
      }
      translateX.value = withSpring(0, { damping: 70, stiffness: 400 });
      hasTriggered.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 30, SWIPE_THRESHOLD], [0, 0.5, 1], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1], Extrapolate.CLAMP) },
    ],
  }));

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.swipeableContainer}>
      <Reanimated.View style={[styles.replyIconContainer, replyIconStyle]}>
        <Ionicons name="arrow-undo" size={18} color="rgba(102, 126, 234, 1)" />
      </Reanimated.View>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.swipeableContent, animatedStyle]}>
          {children}
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

// Empty Event Chat State Component
const EmptyChatState: React.FC<{
  eventName?: string;
  eventMeta?: string;
  eventImage?: string;
}> = ({ eventName, eventMeta, eventImage }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatStyle = {
    transform: [{
      translateY: floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
      }),
    }],
  };

  return (
    <View style={emptyStateStyles.container}>
      {/* Empty State Content */}
      <View style={emptyStateStyles.content}>
        <Animated.View style={[emptyStateStyles.mascotContainer, floatStyle]}>
          <Image source={MascotImage} style={emptyStateStyles.mascotImage} />
        </Animated.View>
        <Text style={emptyStateStyles.title}>It's quiet in here...</Text>
        <Text style={emptyStateStyles.subtitle}>
          Drop a message and get the party started! <Text style={emptyStateStyles.emoji}>🎉</Text>
        </Text>
      </View>
    </View>
  );
};

const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  eventImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  mascotContainer: {
    width: 150,
    height: 150,
    marginBottom: -10,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'ClashDisplay-Semibold',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  emoji: {
    color: '#2dd4bf',
  },
});

const MessageBubble: React.FC<{
  message: Message;
  isFirst: boolean;
  isLast: boolean;
  isEventChat?: boolean;
  isNew?: boolean;
  onReply?: (message: Message) => void;
  onViewThread?: (messageId: string) => void;
}> = ({
  message,
  isFirst,
  isLast,
  isEventChat,
  isNew = false,
  onReply,
  onViewThread,
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

  // For event chats, show sender avatar and name on received messages
  const showSenderInfo = isEventChat && !message.sent && isFirst;

  const bubbleContent = (
    <View style={styles.messageBubbleWrapper}>
      {showSenderInfo && message.senderName && (
        <View style={styles.messageSenderInfo}>
          <View style={styles.messageSenderAvatar}>
            <Text style={styles.messageSenderEmoji}>{message.senderEmoji || '👤'}</Text>
          </View>
          <Text style={styles.messageSenderName}>{message.senderName}</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.sent ? styles.messageBubbleSent : styles.messageBubbleReceived,
          isFirst && (message.sent ? styles.messageBubbleSentFirst : styles.messageBubbleReceivedFirst),
          isLast && (message.sent ? styles.messageBubbleSentLast : styles.messageBubbleReceivedLast),
          isEventChat && !message.sent && styles.messageBubbleEventReceived,
          message.replyTo && message.replyTo.senderName && styles.messageBubbleWithReply,
          message.imageUrl && styles.messageBubbleWithImage,
        ]}
      >
        {message.replyTo && message.replyTo.senderName && (
          <View style={[styles.replyQuote, message.sent && styles.replyQuoteSent]}>
            <View style={[styles.replyQuoteLine, message.sent && styles.replyQuoteLineSent]} />
            <View style={styles.replyQuoteContent}>
              <Text style={[styles.replyQuoteSender, message.sent && styles.replyQuoteSenderSent]}>
                {message.replyTo.senderName}
              </Text>
              <Text style={[styles.replyQuoteText, message.sent && styles.replyQuoteTextSent]} numberOfLines={1}>
                {message.replyTo.text || ''}
              </Text>
            </View>
          </View>
        )}
        {message.imageUrl ? (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : null}
        {message.text ? <Text style={styles.messageText}>{message.text}</Text> : null}
      </View>
      {message.replyCount != null && message.replyCount > 0 && onViewThread && (
        <TouchableOpacity
          style={[styles.threadIndicator, message.sent && styles.threadIndicatorSent]}
          onPress={() => onViewThread(message.id)}
        >
          <Text style={styles.threadIndicatorText}>
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="rgba(102, 126, 234, 1)" />
        </TouchableOpacity>
      )}
    </View>
  );

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  return (
    <SwipeableMessage onReply={handleReply} enabled={isEventChat && !!onReply}>
      <AnimatedMessageBubble isNew={isNew} isSent={message.sent} hasImage={!!message.imageUrl}>
        {bubbleContent}
      </AnimatedMessageBubble>
    </SwipeableMessage>
  );
};

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Track which message IDs should animate (newly sent by current user)
  const animatedMessageIds = useRef<Set<string>>(new Set());
  const seenMessageIds = useRef<Set<string>>(new Set());
  const pendingSentMessage = useRef<boolean>(false);
  const initialLoadComplete = useRef<boolean>(false);

  // Smart scroll tracking - only auto-scroll if user is near bottom
  const isNearBottom = useRef<boolean>(true);
  const prevMessageCount = useRef<number>(0);

  // Track scroll view dimensions for smart scrolling
  const scrollViewHeight = useRef<number>(0);
  const contentHeight = useRef<number>(0);

  // Animated keyboard height for syncing spacer with keyboard
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // Scroll to bottom when keyboard opens (called from worklet)
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Smart scroll that keeps last message visible
  // Used when sending messages with keyboard already open
  const scrollToLastMessage = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  // React to keyboard opening - scroll to bottom in sync
  useAnimatedReaction(
    () => keyboardHeight.value,
    (currentHeight, previousHeight) => {
      // Keyboard is opening (height becoming more negative)
      if (currentHeight < (previousHeight ?? 0) && currentHeight < -50) {
        runOnJS(scrollToBottom)();
      }
    }
  );

  // Animated contentInset - grows with keyboard to push messages up visually
  // contentInset does NOT add to scrollable content, so rubber-band works correctly
  const animatedScrollProps = useAnimatedProps(() => ({
    contentInset: {
      top: 0,
      left: 0,
      right: 0,
      bottom: Math.max(20, -keyboardHeight.value),
    },
    scrollIndicatorInsets: {
      top: 0,
      left: 0,
      right: 0,
      bottom: Math.max(20, -keyboardHeight.value),
    },
  }));

  const { user } = useAuth();
  const { isConnected, connect } = useSocket();

  const conversation = route.params?.conversation || {
    id: '1',
    name: 'Sarah Johnson',
    emoji: '👩‍🦰',
    isOnline: true,
  };

  const isEventChat = conversation.isEventChat ?? false;

  // Use the appropriate chat hook based on chat type
  const dmChat = useChat({
    conversationId: conversation.id,
    isSocketConnected: isConnected && !isEventChat,
  });

  const eventChat = useEventChat({
    eventId: conversation.id,
    isSocketConnected: isConnected && isEventChat,
  });

  // Select the appropriate chat data based on type
  const chatMessages = isEventChat ? eventChat.messages : dmChat.messages;
  const isLoading = isEventChat ? eventChat.isLoading : dmChat.isLoading;
  const isTyping = isEventChat ? eventChat.isTyping : dmChat.isTyping;
  const typingUserName = isEventChat ? eventChat.typingUserName : null;
  const sendMessage = isEventChat ? eventChat.sendMessage : dmChat.sendMessage;
  const startTyping = isEventChat ? eventChat.startTyping : dmChat.startTyping;
  const stopTyping = isEventChat ? eventChat.stopTyping : dmChat.stopTyping;
  const markAsRead = isEventChat ? undefined : dmChat.markAsRead;
  const replyingTo = isEventChat ? eventChat.replyingTo : null;
  const setReplyingTo = isEventChat ? eventChat.setReplyingTo : () => {};
  const getMessageReplies = isEventChat ? eventChat.getMessageReplies : async () => null;

  const [messageText, setMessageText] = useState('');
  const [threadModalVisible, setThreadModalVisible] = useState(false);
  const [threadData, setThreadData] = useState<MessageRepliesResponse | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Thread dismiss animation
  const threadDismissProgress = useSharedValue(0);

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Mark messages as read when viewing (DM only)
  useEffect(() => {
    if (!isEventChat && isConnected && chatMessages.length > 0 && markAsRead) {
      markAsRead();
    }
  }, [isEventChat, isConnected, chatMessages.length, markAsRead]);

  // Mark event chat as read when opening AND when leaving
  useEffect(() => {
    if (isEventChat && conversation.id) {
      // Mark as read when opening
      eventChatService.markEventChatAsRead(conversation.id).catch((err) => {
        console.error('[ChatScreen] Error marking event chat as read:', err);
      });

      // Also mark as read when leaving (cleanup function)
      return () => {
        eventChatService.markEventChatAsRead(conversation.id).catch((err) => {
          console.error('[ChatScreen] Error marking event chat as read on leave:', err);
        });
      };
    }
  }, [isEventChat, conversation.id]);

  // Mark initial load complete after first data fetch
  useEffect(() => {
    if (!isLoading && chatMessages.length >= 0 && !initialLoadComplete.current) {
      initialLoadComplete.current = true;
      // Scroll to bottom on initial load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [isLoading, chatMessages.length]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const messageCount = chatMessages.length;
    const hasNewMessages = messageCount > prevMessageCount.current;

    if (hasNewMessages && initialLoadComplete.current) {
      const isKeyboardOpen = keyboardHeight.value < -50;

      if (isNearBottom.current) {
        setTimeout(() => {
          if (isKeyboardOpen) {
            // When keyboard is open, use smart scroll to show last message
            // without scrolling into the large spacer
            scrollToLastMessage();
          } else {
            // When keyboard is closed, scrollToEnd works fine
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, 50);
      }
    }

    prevMessageCount.current = messageCount;
  }, [chatMessages.length, keyboardHeight, scrollToLastMessage]);

  // Track scroll position and dimensions
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    // Consider "near bottom" if within 100 pixels
    isNearBottom.current = distanceFromBottom < 100;
    // Track dimensions for smart scrolling
    scrollViewHeight.current = layoutMeasurement.height;
    contentHeight.current = contentSize.height;
  }, []);

  // Track content size changes for smart scrolling
  const handleContentSizeChange = useCallback((width: number, height: number) => {
    contentHeight.current = height;
  }, []);

  // Track layout to get scroll view height
  const handleLayout = useCallback((event: any) => {
    scrollViewHeight.current = event.nativeEvent.layout.height;
  }, []);

  // Transform API messages to UI format
  const messages: (Message & { isNew: boolean })[] = chatMessages.map((msg: any) => {
    const isSent = msg.senderId === user?.id;
    const isNewMessage = !seenMessageIds.current.has(msg.id);

    // Mark this message as seen
    seenMessageIds.current.add(msg.id);

    // A message should animate if:
    // 1. Initial load is complete (don't animate on first render)
    // 2. It's from the current user
    // 3. We have a pending sent message flag
    // 4. It's a new message we haven't seen before
    // 5. We haven't animated it yet
    let isNew = false;
    if (
      initialLoadComplete.current &&
      isSent &&
      isNewMessage &&
      pendingSentMessage.current &&
      !animatedMessageIds.current.has(msg.id)
    ) {
      isNew = true;
      animatedMessageIds.current.add(msg.id);
      pendingSentMessage.current = false;
    }

    return {
      id: msg.id,
      text: msg.text,
      imageUrl: isEventChat ? msg.imageUrl : undefined,
      sent: isSent,
      time: new Date(msg.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      read: !isEventChat && !!msg.readAt,
      senderName: isEventChat ? msg.senderName : undefined,
      senderEmoji: isEventChat ? msg.senderEmoji : undefined,
      senderId: msg.senderId,
      replyTo: isEventChat ? msg.replyTo : undefined,
      replyCount: isEventChat ? msg.replyCount : undefined,
      isNew,
    };
  });

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

  const handleSend = async () => {
    if (!messageText.trim() && !pendingImage) return;
    if (isUploading) return;

    // Flag that we're expecting a sent message (for animation)
    pendingSentMessage.current = true;
    // User sending a message means they want to see it
    isNearBottom.current = true;

    let imageUrl: string | undefined;

    // Upload image if there's a pending one
    if (pendingImage) {
      try {
        setIsUploading(true);
        const uploadResponse = await uploadsService.uploadImage(pendingImage);
        imageUrl = uploadResponse.url;
      } catch (error) {
        console.error('[ChatScreen] Image upload error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsUploading(false);
        return;
      }
    }

    sendMessage(messageText.trim(), imageUrl);
    setMessageText('');
    setPendingImage(null);
    setIsUploading(false);
    stopTyping();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Quick emoji send - tapping an emoji chip sends it immediately
  const handleQuickEmoji = (emoji: string) => {
    pendingSentMessage.current = true;
    isNearBottom.current = true;
    sendMessage(emoji);
  };

  // Handle image picking (Event Chat only) - just sets preview, doesn't send
  const handlePickImage = async () => {
    if (!isEventChat) return;

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('[ChatScreen] Media library permission denied');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      // Set pending image for preview
      setPendingImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[ChatScreen] Image picker error:', error);
    }
  };

  // Remove pending image
  const handleRemovePendingImage = () => {
    setPendingImage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle reply to a message
  const handleReply = useCallback((message: Message) => {
    setReplyingTo({
      id: message.id,
      text: message.text,
      senderName: message.senderName || 'Unknown',
      senderId: message.senderId || '',
    });
  }, [setReplyingTo]);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, [setReplyingTo]);

  // View thread (iOS-style focus view) - fetch data first, then animate in
  const handleViewThread = useCallback(async (messageId: string) => {
    // Fetch data first (no loading spinner)
    const data = await getMessageReplies(messageId);
    if (data) {
      setThreadData(data);
      setThreadModalVisible(true);
    }
  }, [getMessageReplies]);

  // Close thread modal with blur-out animation
  const handleCloseThread = useCallback(() => {
    // Animate blur out
    threadDismissProgress.value = withTiming(1, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setThreadModalVisible)(false);
        runOnJS(setThreadData)(null);
      }
    });
  }, [threadDismissProgress]);

  // Reset dismiss progress when modal opens
  useEffect(() => {
    if (threadModalVisible) {
      threadDismissProgress.value = 0;
    }
  }, [threadModalVisible, threadDismissProgress]);

  // Animated style for thread dismiss blur-out effect
  const threadDismissStyle = useAnimatedStyle(() => ({
    opacity: interpolate(threadDismissProgress.value, [0, 1], [1, 0]),
    transform: [
      { scale: interpolate(threadDismissProgress.value, [0, 1], [1, 0.95]) },
    ],
  }));

  return (
    <View style={styles.container}>
      {isEventChat ? (
        <Image
          source={EventChatBackground}
          style={styles.eventChatBackgroundImage}
          resizeMode="cover"
        />
      ) : (
        <ProfileBackground />
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <BlurView intensity={40} tint="dark" style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.chatUserInfo}>
            {isEventChat && conversation.eventImage ? (
              <Image
                source={{ uri: conversation.eventImage }}
                style={styles.chatEventImage}
              />
            ) : (
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarEmoji}>{conversation.emoji}</Text>
                {!isEventChat && conversation.isOnline && <View style={styles.chatOnlineDot} />}
              </View>
            )}
            <View style={styles.chatUserDetails}>
              <Text style={styles.chatUserName}>{conversation.name}</Text>
              <Text style={styles.chatUserStatus}>
                {isEventChat ? 'Event Chat' : (conversation.isOnline ? 'Online' : 'Offline')}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {!isEventChat && (
              <TouchableOpacity style={styles.headerActionBtn}>
                <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerActionBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Messages with gesture-controlled keyboard */}
        <KeyboardGestureArea
          style={{ flex: 1 }}
          interpolator="ios"
          textInputNativeID="chatInput"
        >
          <AnimatedScrollView
            ref={scrollViewRef}
            style={styles.messagesArea}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
            animatedProps={animatedScrollProps}
          >
          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#667eea" />
            </View>
          )}

          {/* Empty State for Event Chat */}
          {!isLoading && messages.length === 0 && isEventChat && (
            <EmptyChatState
              eventName={conversation.name}
              eventImage={conversation.eventImage}
            />
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
                    isEventChat={isEventChat}
                    isNew={(message as any).isNew}
                    onReply={handleReply}
                    onViewThread={handleViewThread}
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
              {/* Only show read receipts for DM chats */}
              {!isEventChat && group.sent && group.messages[group.messages.length - 1].read && (
                <View style={styles.readReceipt}>
                  <Ionicons name="checkmark-done" size={14} color="#667eea" />
                  <Text style={styles.readReceiptText}>Read</Text>
                </View>
              )}
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator emoji={conversation.emoji} userName={typingUserName} />}
          </AnimatedScrollView>
        </KeyboardGestureArea>

        {/* Input area - FIXED at bottom, moves with keyboard */}
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          {/* Reply Preview Bar */}
          {replyingTo && (
            <View style={styles.replyPreview}>
              <View style={styles.replyPreviewContent}>
                <View style={styles.replyPreviewLine} />
                <View style={styles.replyPreviewTextContainer}>
                  <Text style={styles.replyPreviewSender}>Replying to {replyingTo.senderName}</Text>
                  <Text style={styles.replyPreviewText} numberOfLines={1}>{replyingTo.text}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.replyPreviewClose} onPress={handleCancelReply}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Reactions */}
          <View style={styles.quickReactions}>
            {quickReactions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionChip}
                onPress={() => handleQuickEmoji(emoji)}
              >
                <Text style={styles.reactionChipEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Area */}
          <BlurView intensity={40} tint="dark" style={[styles.inputArea, { paddingBottom: insets.bottom > 0 ? insets.bottom : 0 }]}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.attachmentBtn, pendingImage && styles.attachmentBtnActive]}
                onPress={handlePickImage}
                disabled={isUploading || !isEventChat}
              >
                <Ionicons name="image-outline" size={22} color={isEventChat ? (pendingImage ? "#667eea" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.3)"} />
              </TouchableOpacity>

              <View style={[styles.messageInputWrapper, pendingImage && styles.messageInputWrapperWithImage]}>
                {/* Pending Image Preview Inside Input */}
                {pendingImage && (
                  <View style={styles.pendingImageInline}>
                    <Image source={{ uri: pendingImage }} style={styles.pendingImagePreview} />
                    <TouchableOpacity
                      style={styles.pendingImageRemoveBtn}
                      onPress={handleRemovePendingImage}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                    {isUploading && (
                      <View style={styles.pendingImageUploading}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                )}
                <TextInput
                  nativeID="chatInput"
                  style={styles.messageInput}
                  placeholder="Message..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={messageText}
                  onChangeText={handleTextChange}
                  multiline
                  maxLength={1000}
                />
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, (!messageText.trim() && !pendingImage) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={(!messageText.trim() && !pendingImage) || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardStickyView>
      </SafeAreaView>

      {/* Thread Focus Modal - iOS-style blur focus view */}
      <Modal
        visible={threadModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseThread}
      >
        <Pressable style={styles.threadFocusOverlay} onPress={handleCloseThread}>
          <Reanimated.View
            style={[styles.threadFocusBlurContainer, threadDismissStyle]}
            entering={FadeIn.duration(150)}
          >
            <BlurView intensity={90} tint="dark" style={styles.threadFocusBlur}>
              <Reanimated.View
                style={styles.threadFocusContent}
                entering={FadeIn.duration(100)}
              >
                {threadData && (
                  <ScrollView
                    style={styles.threadScrollView}
                    contentContainerStyle={styles.threadScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Original Message - Animated */}
                    <Reanimated.View
                      style={styles.threadOriginalMessage}
                      entering={SlideInLeft.duration(250).springify().damping(70).stiffness(500)}
                    >
                      <View style={styles.threadMessageRow}>
                        <View style={styles.threadAvatarColumn}>
                          <View style={styles.threadSenderAvatar}>
                            <Text style={styles.threadSenderEmoji}>{threadData.originalMessage.senderEmoji || '👤'}</Text>
                          </View>
                          {threadData.replies.length > 0 && (
                            <Reanimated.View
                              style={styles.threadConnectorLine}
                              entering={FadeIn.duration(100)}
                            />
                          )}
                        </View>
                        <View style={styles.threadMessageContent}>
                          <View style={styles.threadMessageHeader}>
                            <Text style={styles.threadSenderName}>{threadData.originalMessage.senderName}</Text>
                            <Text style={styles.threadMessageTime}>
                              {new Date(threadData.originalMessage.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                          </View>
                          <View style={styles.threadOriginalBubble}>
                            <Text style={styles.threadMessageText}>{threadData.originalMessage.text}</Text>
                          </View>
                        </View>
                      </View>
                    </Reanimated.View>

                    {/* Replies - Staggered Animation */}
                    {threadData.replies.map((reply, index) => (
                      <Reanimated.View
                        key={reply.id}
                        style={styles.threadReply}
                        entering={SlideInLeft.duration(250).delay(index * 25).springify().damping(70).stiffness(500)}
                      >
                        <View style={styles.threadMessageRow}>
                          <View style={styles.threadAvatarColumn}>
                            <View style={styles.threadSenderAvatar}>
                              <Text style={styles.threadSenderEmoji}>{reply.senderEmoji || '👤'}</Text>
                            </View>
                            {index < threadData.replies.length - 1 && (
                              <Reanimated.View
                                style={styles.threadConnectorLine}
                                entering={FadeIn.duration(100).delay(index * 25)}
                              />
                            )}
                          </View>
                          <View style={styles.threadMessageContent}>
                            <View style={styles.threadMessageHeader}>
                              <Text style={styles.threadSenderName}>{reply.senderName}</Text>
                              <Text style={styles.threadMessageTime}>
                                {new Date(reply.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </Text>
                            </View>
                            <View style={styles.threadReplyBubble}>
                              <Text style={styles.threadMessageText}>{reply.text}</Text>
                            </View>
                          </View>
                        </View>
                      </Reanimated.View>
                    ))}
                  </ScrollView>
                )}
              </Reanimated.View>
            </BlurView>
          </Reanimated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  eventChatBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
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
  chatEventImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 1,
    alignSelf: 'flex-start',
    // maxWidth removed - was causing text clipping
  },
  messageBubbleSent: {
    backgroundColor: 'rgba(102, 126, 234, 0.85)',
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-end',
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
  messageBubbleEventReceived: {
    marginLeft: 40,
  },
  messageBubbleWithReply: {
    minWidth: 180,
  },
  messageBubbleWithImage: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    overflow: 'hidden',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 20,
  },
  messageBubbleWrapper: {
    // Removed width: '100%' - was causing text clipping with maxWidth on bubble
  },
  messageSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  messageSenderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageSenderEmoji: {
    fontSize: 14,
  },
  messageSenderName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
    fontFamily: 'ClashDisplay-Medium',
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
  typingUserName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 4,
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
    marginBottom: -14,
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
  attachmentBtnUploading: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  attachmentBtnActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  pendingImageInline: {
    marginRight: 8,
  },
  pendingImagePreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pendingImageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(60,60,60,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pendingImageUploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInputWrapperWithImage: {
    paddingLeft: 8,
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
  // Swipeable message styles
  swipeableContainer: {
    position: 'relative',
    width: '100%',
  },
  swipeableContent: {
    width: '100%',
  },
  replyIconContainer: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Reply quote styles (inside message bubble)
  replyQuote: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 120,
  },
  replyQuoteSent: {
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  replyQuoteLine: {
    width: 2,
    minHeight: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    marginRight: 8,
    alignSelf: 'stretch',
  },
  replyQuoteLineSent: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  replyQuoteContent: {
    flex: 1,
    minWidth: 0,
  },
  replyQuoteSender: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  replyQuoteSenderSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  replyQuoteText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  replyQuoteTextSent: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Thread indicator styles
  threadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  threadIndicatorSent: {
    alignSelf: 'flex-end',
  },
  threadIndicatorText: {
    fontSize: 12,
    color: 'rgba(102, 126, 234, 1)',
    fontWeight: '500',
  },
  // Reply preview bar styles (above input)
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.2)',
  },
  replyPreviewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyPreviewLine: {
    width: 3,
    height: 32,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    borderRadius: 2,
    marginRight: 10,
  },
  replyPreviewTextContainer: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(102, 126, 234, 1)',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  replyPreviewClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Thread focus modal styles (iOS-style blur view)
  threadFocusOverlay: {
    flex: 1,
  },
  threadFocusBlurContainer: {
    flex: 1,
  },
  threadFocusBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
  },
  threadFocusContent: {
    maxHeight: '50%',
  },
  threadLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadScrollView: {
  },
  threadScrollContent: {
    paddingVertical: 8,
  },
  threadOriginalMessage: {
    marginBottom: 0,
  },
  threadMessageRow: {
    flexDirection: 'row',
  },
  threadAvatarColumn: {
    alignItems: 'center',
    width: 40,
  },
  threadConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    marginVertical: 4,
  },
  threadMessageContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 8,
  },
  threadMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  threadSenderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadSenderEmoji: {
    fontSize: 16,
  },
  threadSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  threadMessageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  threadOriginalBubble: {
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  threadMessageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
  },
  threadReply: {
    marginBottom: 0,
  },
  threadReplyBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
