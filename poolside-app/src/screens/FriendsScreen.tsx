import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useConversations } from '../hooks';
import { Conversation } from '../api';

// Mock conversations data (fallback when API unavailable)
const mockConversations: DisplayConversation[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    emoji: '👩‍🦰',
    lastMessage: 'See you at the pool party!',
    time: '2m ago',
    isOnline: true,
    unreadCount: 3,
    isTyping: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    emoji: '👨‍🦱',
    lastMessage: 'That sunset was amazing! Are you coming to the...',
    time: '15m ago',
    isOnline: true,
    unreadCount: 1,
    isTyping: false,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    emoji: '👩',
    lastMessage: 'Thanks for the drink recommendation!',
    time: '1h ago',
    isOnline: true,
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: '4',
    name: 'David Park',
    emoji: '👨',
    lastMessage: 'Are you going to trivia tonight?',
    time: '2h ago',
    isOnline: false,
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: '5',
    name: 'Olivia Davis',
    emoji: '👧',
    lastMessage: 'The karaoke was so fun! 🎤',
    time: '5h ago',
    isOnline: true,
    unreadCount: 0,
    isTyping: false,
    isMuted: true,
  },
  {
    id: '6',
    name: 'Ryan Thompson',
    emoji: '🧔',
    lastMessage: "Let's grab dinner at the Italian place",
    time: 'Yesterday',
    isOnline: false,
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: '7',
    name: 'James Rodriguez',
    emoji: '👦',
    lastMessage: 'Thanks for the photos!',
    time: 'Yesterday',
    isOnline: false,
    unreadCount: 0,
    isTyping: false,
  },
];

interface DisplayConversation {
  id: string;
  name: string;
  emoji: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  unreadCount: number;
  isTyping?: boolean;
  isMuted?: boolean;
}

// Convert API conversation to display format
const mapApiConversation = (conv: Conversation): DisplayConversation => {
  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return {
    id: conv.id,
    name: conv.participant.name,
    emoji: conv.participant.emoji || '👤',
    lastMessage: conv.lastMessage?.text || 'No messages yet',
    time: conv.lastMessage ? formatTime(conv.lastMessage.sentAt) : '',
    isOnline: conv.participant.isOnline,
    unreadCount: conv.unreadCount,
    isTyping: false,
  };
};

const TypingDots: React.FC = () => (
  <View style={styles.typingDots}>
    <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
    <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
    <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
  </View>
);

const ConversationCard: React.FC<{ conversation: DisplayConversation; onPress: () => void }> = ({
  conversation,
  onPress,
}) => {
  const isUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.conversationItem, isUnread && styles.conversationItemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isUnread && <View style={styles.unreadIndicator} />}

      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{conversation.emoji}</Text>
        </View>
        {conversation.isTyping ? (
          <View style={styles.typingIndicator}>
            <TypingDots />
          </View>
        ) : conversation.isOnline ? (
          <View style={styles.onlineDot} />
        ) : null}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{conversation.name}</Text>
          <Text style={[styles.conversationTime, isUnread && styles.conversationTimeUnread]}>
            {conversation.isTyping ? 'Now' : conversation.time}
          </Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text
            style={[styles.previewText, isUnread && styles.previewTextUnread]}
            numberOfLines={1}
          >
            {conversation.isTyping ? 'typing...' : conversation.lastMessage}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
          {conversation.isMuted && (
            <Ionicons name="volume-mute" size={16} color="rgba(255,255,255,0.3)" />
          )}
        </View>
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const { conversations: apiConversations, isLoading, error, refresh } = useConversations();

  // Map API conversations or use mock data as fallback
  const conversations: DisplayConversation[] =
    error || apiConversations.length === 0
      ? mockConversations
      : apiConversations.map(mapApiConversation);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: DisplayConversation) => {
    navigation.navigate('Chat' as never, { conversation } as never);
  };

  const filters = ['All', 'Unread', 'Friends', 'Event Chats'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a12', '#0d0d1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="add" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
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

        {/* Conversations List - Single list, no sections */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
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
              />
            }
          >
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onPress={() => handleConversationPress(conversation)}
              />
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}
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
    marginBottom: 4,
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
});
