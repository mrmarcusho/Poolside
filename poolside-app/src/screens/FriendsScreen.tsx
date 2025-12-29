import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Mock friends data
const mockFriends = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: '👩‍🦰',
    lastMessage: 'See you at the pool party!',
    time: '2m ago',
    online: true,
    unread: 2,
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: '👨‍🦱',
    lastMessage: 'That sunset was amazing 🌅',
    time: '15m ago',
    online: true,
    unread: 0,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    avatar: '👩',
    lastMessage: 'Thanks for the drink recommendation!',
    time: '1h ago',
    online: false,
    unread: 0,
  },
  {
    id: '4',
    name: 'David Park',
    avatar: '👨',
    lastMessage: 'Are you going to trivia tonight?',
    time: '2h ago',
    online: true,
    unread: 1,
  },
  {
    id: '5',
    name: 'Jessica Miller',
    avatar: '👩‍🦳',
    lastMessage: 'Great meeting you at yoga!',
    time: '3h ago',
    online: false,
    unread: 0,
  },
  {
    id: '6',
    name: 'Ryan Thompson',
    avatar: '🧔',
    lastMessage: 'Let\'s grab dinner later',
    time: '5h ago',
    online: false,
    unread: 0,
  },
  {
    id: '7',
    name: 'Olivia Davis',
    avatar: '👧',
    lastMessage: 'The karaoke was so fun! 🎤',
    time: 'Yesterday',
    online: true,
    unread: 0,
  },
  {
    id: '8',
    name: 'James Rodriguez',
    avatar: '👦',
    lastMessage: 'Thanks for the photos!',
    time: 'Yesterday',
    online: false,
    unread: 0,
  },
];

interface Friend {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  online: boolean;
  unread: number;
}

const FriendCard: React.FC<{ friend: Friend; onPress: () => void }> = ({
  friend,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.friendCard} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{friend.avatar}</Text>
        </View>
        {friend.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.friendHeader}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.messageTime}>{friend.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {friend.lastMessage}
          </Text>
          {friend.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{friend.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FriendsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <ScrollView
        style={styles.friendsList}
        contentContainerStyle={styles.friendsListContent}
        showsVerticalScrollIndicator={false}
      >
        {mockFriends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            onPress={() => console.log('Open chat with', friend.name)}
          />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
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
