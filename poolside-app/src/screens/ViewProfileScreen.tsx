import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usersService } from '../api/services/users';
import { MainStackParamList } from '../navigation/MainNavigator';
import * as Haptics from 'expo-haptics';

const ProfileBackgroundImage = require('../assets/images/Starynight.png');

const { width } = Dimensions.get('window');
const PHOTO_WIDTH = width - 40;

type ViewProfileRouteProp = RouteProp<MainStackParamList, 'ViewProfile'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  emoji: string;
  location: string;
  college: string;
  bio: string;
  photos: string[];
  interests: { emoji: string; label: string }[];
  stats: { followers: number; following: number; eventsHosted: number };
  isOnline: boolean;
}

export const ViewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewProfileRouteProp>();
  const { userId } = route.params;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const apiUser = await usersService.getUserById(userId);

      setUser({
        id: apiUser.id,
        name: apiUser.name,
        age: (apiUser as any).age || null,
        emoji: apiUser.emoji || '👤',
        location: (apiUser as any).location || '',
        college: (apiUser as any).school || '',
        bio: (apiUser as any).bio || '',
        photos: apiUser.avatar ? [apiUser.avatar] : [],
        interests: (apiUser as any).interests || [],
        stats: {
          followers: 0,
          following: 0,
          eventsHosted: 0,
        },
        isOnline: apiUser.isOnline,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / PHOTO_WIDTH);
    setActivePhotoIndex(index);
  };

  const handleAddFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement friend request
  };

  const handleMessage = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Chat', {
      conversation: {
        id: user.id,
        name: user.name,
        emoji: user.emoji,
        isOnline: user.isOnline,
      },
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={ProfileBackgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
              <Text style={styles.headerBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerBtn} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Image
          source={ProfileBackgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
              <Text style={styles.headerBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerBtn} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderPhoto = ({ item }: { item: string }) => (
    <View style={styles.photoItem}>
      <Image source={{ uri: item }} style={styles.photo} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Starry Night Background Image */}
      <Image
        source={ProfileBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery or Avatar */}
        {user.photos.length > 0 ? (
          <>
            <FlatList
              data={user.photos}
              renderItem={renderPhoto}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.photoGallery}
              contentContainerStyle={styles.photoGalleryContent}
              snapToInterval={PHOTO_WIDTH + 8}
              decelerationRate="fast"
            />
            {user.photos.length > 1 && (
              <View style={styles.photoDots}>
                {user.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activePhotoIndex === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.avatarSection}>
            <View style={styles.largeAvatar}>
              <Text style={styles.largeAvatarEmoji}>{user.emoji}</Text>
            </View>
          </View>
        )}

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Name Row with Online Status */}
          <View style={styles.nameRow}>
            <View style={styles.nameInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.age != null && <Text style={styles.userAge}>{user.age}</Text>}
              <Text style={styles.userEmoji}>{user.emoji}</Text>
              {user.isOnline && <View style={styles.onlineIndicator} />}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.addFriendBtn} onPress={handleAddFriend}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addFriendGradient}
              >
                <Text style={styles.addFriendText}>Add Friend</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
              <Text style={styles.messageBtnText}>💬 Message</Text>
            </TouchableOpacity>
          </View>

          {/* Location */}
          {user.location ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          ) : null}

          {/* College */}
          {user.college ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎓</Text>
              <Text style={styles.infoText}>{user.college}</Text>
            </View>
          ) : null}

          {/* Bio */}
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {/* Interest Tags */}
          {user.interests.length > 0 && (
            <View style={styles.tags}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {interest.emoji} {interest.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.stats.eventsHosted}</Text>
              <Text style={styles.statLabel}>Events Hosted</Text>
            </View>
          </View>

          {/* Bottom padding for safe area */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Photo Gallery
  photoGallery: {
    flexGrow: 0,
  },
  photoGalleryContent: {
    paddingHorizontal: 16,
  },
  photoItem: {
    width: PHOTO_WIDTH,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  // Avatar Section (when no photos)
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatarEmoji: {
    fontSize: 60,
  },
  // Profile Content
  profileContent: {
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userAge: {
    fontSize: 24,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginLeft: 4,
  },
  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addFriendBtn: {
    flex: 1,
  },
  addFriendGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addFriendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  messageBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  infoText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bio: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Tags
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#a5b4fc',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stat: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
