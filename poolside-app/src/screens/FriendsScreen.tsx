import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  ImageBackground,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { eventChatService, EventChat } from '../api/services/eventChat';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks';
import { socketService, NewEventMessageEvent } from '../api/socket';

interface DisplayEventChat {
  id: string;
  title: string;
  eventImage: string | null;
  dateTime: string;
  hostName: string;
  isHost: boolean;
  lastMessage: string;
  lastMessageSender: string;
  time: string;
  messageCount: number;
  unreadCount: number;
}

// Convert API event chat to display format
const mapApiEventChat = (chat: EventChat): DisplayEventChat => {
  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return {
    id: chat.id,
    title: chat.title,
    eventImage: chat.eventImage,
    dateTime: formatEventDate(chat.dateTime),
    hostName: chat.host.name,
    isHost: chat.isHost,
    lastMessage: chat.lastMessage?.text || 'No messages yet',
    lastMessageSender: chat.lastMessage?.isFromMe ? 'You' : chat.lastMessage?.senderName || '',
    time: chat.lastMessage ? formatTime(chat.lastMessage.sentAt) : '',
    messageCount: chat.messageCount,
    unreadCount: chat.unreadCount || 0,
  };
};

// Default fallback images for events without images
const FALLBACK_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400', // Confetti party
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400', // Festival crowd
  'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=400', // Party lights
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', // Concert
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400', // Balloons
];

// Get a consistent fallback image based on event ID
const getFallbackImage = (eventId: string) => {
  const hash = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_EVENT_IMAGES[hash % FALLBACK_EVENT_IMAGES.length];
};

const EventChatCard: React.FC<{ eventChat: DisplayEventChat; onPress: () => void }> = ({
  eventChat,
  onPress,
}) => {
  // Determine event badge text based on date
  const getEventBadge = () => {
    const eventDate = new Date(eventChat.dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (eventDate.toDateString() === today.toDateString()) return 'TODAY';
    if (eventDate.toDateString() === tomorrow.toDateString()) return 'TOMORROW';
    return eventChat.dateTime.toUpperCase();
  };

  // Get image URL - use event image if available, otherwise use consistent fallback
  const imageUrl = eventChat.eventImage || getFallbackImage(eventChat.id);

  const hasUnread = eventChat.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.chatCard, hasUnread && styles.chatCardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Event Image */}
      <View style={styles.chatCardImageWrapper}>
        <Image source={{ uri: imageUrl }} style={styles.chatCardImage} />
      </View>

      {/* Chat Info */}
      <View style={styles.chatCardContent}>
        <View style={styles.chatCardHeader}>
          <Text style={styles.chatCardTitle} numberOfLines={1}>{eventChat.title}</Text>
          <View style={styles.chatCardBadge}>
            <Text style={styles.chatCardBadgeText}>{getEventBadge()}</Text>
          </View>
        </View>
        <Text style={[styles.chatCardPreview, hasUnread && styles.chatCardPreviewUnread]} numberOfLines={1}>
          {eventChat.lastMessageSender ? `${eventChat.lastMessageSender}: ${eventChat.lastMessage}` : eventChat.lastMessage}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.chatCardMeta}>
        <Text style={[styles.chatCardTime, hasUnread && styles.chatCardTimeUnread]}>{eventChat.time}</Text>
        {hasUnread && (
          <View style={styles.chatCardUnreadBadge}>
            <Text style={styles.chatCardUnreadBadgeText}>
              {eventChat.unreadCount > 99 ? '99+' : eventChat.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isConnected, connect } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [eventChats, setEventChats] = useState<EventChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Track reconnections to force room re-joining
  const [reconnectCount, setReconnectCount] = useState(0);

  // Fetch event chats
  const fetchEventChats = useCallback(async () => {
    try {
      setError(null);
      const response = await eventChatService.getEventChats();
      setEventChats(response.eventChats);
    } catch (err) {
      console.error('[FriendsScreen] Error fetching event chats:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle app state changes (background -> foreground)
  // When app comes back to foreground, reconnect socket if needed
  useEffect(() => {
    const appStateRef = { current: AppState.currentState };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('[FriendsScreen] AppState changed from', appStateRef.current, 'to', nextAppState);

      // App came back to foreground
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[FriendsScreen] App came to foreground, checking socket connection');
        // Proactively try to reconnect socket
        connect();
        // Also increment reconnectCount to force room re-joining
        // in case socket was already connected but rooms were lost
        if (socketService.isConnected()) {
          console.log('[FriendsScreen] Socket is connected, forcing room re-join');
          setReconnectCount(prev => prev + 1);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [connect]);

  // Listen for socket reconnection events to force room re-joining
  // This is more reliable than depending on isConnected state changes alone
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleReconnect = () => {
      console.log('[FriendsScreen] Socket reconnected event detected, incrementing reconnectCount');
      setReconnectCount(prev => prev + 1);
    };

    // Listen for 'connect' event which fires on reconnection
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [isConnected]); // Re-setup listener when connection state changes

  // Join all event chat rooms and listen for new messages
  // This effect re-runs when isConnected changes OR when socket reconnects (reconnectCount)
  // We always re-join rooms because Socket.IO loses room memberships on disconnect
  useEffect(() => {
    console.log('[FriendsScreen] Socket effect running - isConnected:', isConnected, 'eventChats.length:', eventChats.length, 'hasSocket:', socketService.hasSocket(), 'reconnectCount:', reconnectCount);

    if (!isConnected || eventChats.length === 0) {
      console.log('[FriendsScreen] Socket effect returning early - isConnected:', isConnected, 'eventChats.length:', eventChats.length);
      return;
    }

    // Double-check socket is available
    if (!socketService.hasSocket()) {
      console.error('[FriendsScreen] ERROR: isConnected is true but socket is null! This should not happen.');
      return;
    }

    // Join rooms for all event chats we're part of
    // Always join (Socket.IO handles duplicates gracefully, and we need to rejoin after reconnect)
    console.log('[FriendsScreen] Joining', eventChats.length, 'event chat rooms');
    eventChats.forEach((chat) => {
      socketService.joinEventChat(chat.id);
    });

    // Handle new messages - update unread count in real-time
    const handleNewMessage = (data: NewEventMessageEvent) => {
      console.log('[FriendsScreen] Received new_event_message:', data.eventId, 'from:', data.message.senderId, 'current user:', user?.id);
      // Only increment unread if the message is from someone else
      if (data.message.senderId !== user?.id) {
        console.log('[FriendsScreen] Updating unread count for event:', data.eventId);
        setEventChats((prev) =>
          prev.map((chat) => {
            if (chat.id === data.eventId) {
              return {
                ...chat,
                unreadCount: chat.unreadCount + 1,
                lastMessage: {
                  text: data.message.text,
                  senderName: data.message.senderName,
                  sentAt: data.message.sentAt,
                  isFromMe: false,
                },
              };
            }
            return chat;
          })
        );
      }
    };

    console.log('[FriendsScreen] Registering new_event_message listener');
    socketService.onNewEventMessage(handleNewMessage);

    // Cleanup - remove listener
    return () => {
      console.log('[FriendsScreen] Cleanup - removing new_event_message listener');
      socketService.offNewEventMessage(handleNewMessage);
    };
  }, [isConnected, eventChats.length, user?.id, reconnectCount]);

  // Refresh event chats when screen comes into focus
  // Small delay to allow mark-as-read calls to complete before fetching
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        fetchEventChats();
      }, 100);
      return () => clearTimeout(timer);
    }, [fetchEventChats])
  );

  // Map API event chats to display format
  const displayEventChats: DisplayEventChat[] = eventChats.map(mapApiEventChat);

  // Filter event chats based on active filter
  const filteredEventChats = displayEventChats.filter(chat => {
    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      if (!chat.title.toLowerCase().includes(searchLower) &&
          !chat.hostName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    switch (activeFilter) {
      case 'My Events':
        return chat.isHost;
      case 'Attending':
        return !chat.isHost;
      default:
        return true;
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEventChats();
    setRefreshing(false);
  };

  const handleEventChatPress = (eventChat: DisplayEventChat) => {
    navigation.navigate('Chat' as never, {
      conversation: {
        id: eventChat.id,
        name: eventChat.title,
        emoji: '📅',
        isOnline: false,
        isEventChat: true,
        eventImage: eventChat.eventImage,
      },
    } as never);
  };

  const filters = ['All', 'My Events', 'Attending'];

  return (
    <ImageBackground
      source={require('../assets/images/feed-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Event Chats</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search event chats..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Filter Pills - Evenly Spaced */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <FilterPill
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </View>

        {/* Event Chats List */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : filteredEventChats.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(102, 126, 234, 0.5)" />
            </View>
            <Text style={styles.emptyStateTitle}>
              {searchText ? 'No Matches' : activeFilter === 'My Events' ? 'No Events Created' : activeFilter === 'Attending' ? 'No Events Joined' : 'No Event Chats Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchText
                ? 'Try a different search term'
                : activeFilter === 'My Events'
                ? 'Create an event to start chatting with attendees'
                : activeFilter === 'Attending'
                ? 'RSVP to events to join their chat'
                : 'Join an event to start chatting with other attendees'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.conversationsList}
            contentContainerStyle={styles.conversationsContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#667eea"
                colors={['#667eea']}
              />
            }
          >
            {filteredEventChats.map((eventChat) => (
              <EventChatCard
                key={eventChat.id}
                eventChat={eventChat}
                onPress={() => handleEventChatPress(eventChat)}
              />
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  // Design 6: Modern Sleek Chat Card
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chatCardImageWrapper: {
    flexShrink: 0,
  },
  chatCardImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  chatCardImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCardContent: {
    flex: 1,
    minWidth: 0,
  },
  chatCardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  chatCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flexShrink: 1,
  },
  chatCardBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
  },
  chatCardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#667eea',
  },
  chatCardPreview: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chatCardMeta: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  chatCardTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  chatCardUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chatCardPreviewUnread: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  chatCardTimeUnread: {
    color: '#667eea',
    fontWeight: '600',
  },
  chatCardUnreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  chatCardUnreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  // Legacy styles (kept for reference)
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  conversationItemUnread: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderColor: 'rgba(102, 126, 234, 0.25)',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    width: 3,
    height: '50%',
    backgroundColor: '#667eea',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hostBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#667eea',
    borderWidth: 2,
    borderColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#0a0a0f',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#667eea',
    borderWidth: 3,
    borderColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 1,
  },
  typingDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  eventDot: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  eventHost: {
    fontSize: 12,
    color: 'rgba(102, 126, 234, 0.8)',
    fontWeight: '500',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  conversationTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  conversationTimeUnread: {
    color: '#667eea',
    fontWeight: '600',
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  previewTextUnread: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  messageCountBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
