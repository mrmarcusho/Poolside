import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Mike Chen',
    emoji: '👨‍🦱',
    lastMessage: 'That sunset was amazing 🌅',
    time: '15m ago',
    isOnline: true,
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    emoji: '👩',
    lastMessage: 'Thanks for the drink recommendation!',
    time: '1h ago',
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: '4',
    name: 'David Park',
    emoji: '👨',
    lastMessage: 'Are you going to trivia tonight?',
    time: '2h ago',
    isOnline: true,
    unreadCount: 1,
  },
  {
    id: '5',
    name: 'Jessica Miller',
    emoji: '👩‍🦳',
    lastMessage: 'Great meeting you at yoga!',
    time: '3h ago',
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: '6',
    name: 'Ryan Thompson',
    emoji: '🧔',
    lastMessage: "Let's grab dinner later",
    time: '5h ago',
    isOnline: false,
    unreadCount: 0,
  },
  {
    id: '7',
    name: 'Olivia Davis',
    emoji: '👧',
    lastMessage: 'The karaoke was so fun! 🎤',
    time: 'Yesterday',
    isOnline: true,
    unreadCount: 0,
  },
  {
    id: '8',
    name: 'James Rodriguez',
    emoji: '👦',
    lastMessage: 'Thanks for the photos!',
    time: 'Yesterday',
    isOnline: false,
    unreadCount: 0,
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
  };
};

const ConversationCard: React.FC<{ conversation: DisplayConversation; onPress: () => void }> = ({
  conversation,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.friendCard} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{conversation.emoji}</Text>
        </View>
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.friendHeader}>
          <Text style={styles.friendName}>{conversation.name}</Text>
          <Text style={styles.messageTime}>{conversation.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FriendsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { conversations: apiConversations, isLoading, error, refresh } = useConversations();

  // Map API conversations or use mock data as fallback
  const conversations: DisplayConversation[] = error || apiConversations.length === 0
    ? mockConversations
    : apiConversations.map(mapApiConversation);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView
          style={styles.friendsList}
          contentContainerStyle={styles.friendsListContent}
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
              onPress={() => console.log('Open chat with', conversation.name)}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingTop: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
