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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { EditProfileScreen } from './EditProfileScreen';
import { SettingsModal } from '../components/SettingsModal';
import { usersService, CurrentUser } from '../api/services/users';

const { width } = Dimensions.get('window');
const PHOTO_WIDTH = width - 40;

// Empty defaults for new users
const emptyStats = {
  followers: 0,
  following: 0,
  eventsHosted: 0,
};

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
  pastEvents: { id: string; title: string; date: string; image: string; type: string }[];
}

export const ProfileScreen: React.FC = () => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Fetch user profile from API on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const apiUser = await usersService.getMe();

      // Use actual user data - empty arrays for new users
      setUser({
        id: apiUser.id,
        name: apiUser.name,
        age: apiUser.age,
        emoji: apiUser.emoji || '👤',
        location: apiUser.location || '',
        college: apiUser.school || '',
        bio: apiUser.bio || '',
        photos: apiUser.avatar ? [apiUser.avatar] : [], // Empty for new users
        interests: apiUser.interests || [], // Empty for new users
        stats: emptyStats, // TODO: Fetch from API when available
        pastEvents: [], // TODO: Fetch from API when available
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use fallback data on error
      setUser({
        id: '0',
        name: 'Guest',
        age: null,
        emoji: '👤',
        location: '',
        college: '',
        bio: '',
        photos: [],
        interests: [],
        stats: emptyStats,
        pastEvents: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / PHOTO_WIDTH);
    setActivePhotoIndex(index);
  };

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = (updatedData: any) => {
    setUser(prev => prev ? {
      ...prev,
      name: updatedData.name,
      age: updatedData.age,
      location: updatedData.location,
      college: updatedData.school,
      bio: updatedData.bio,
      interests: updatedData.interests,
    } : null);
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  const renderPhoto = ({ item }: { item: string }) => (
    <View style={styles.photoItem}>
      <Image source={{ uri: item }} style={styles.photo} />
    </View>
  );

  const renderPastEvent = (event: typeof user.pastEvents[0]) => (
    <View key={event.id} style={styles.pastEvent}>
      <Image source={{ uri: event.image }} style={styles.pastEventImage} />
      <View style={styles.pastEventInfo}>
        <Text style={styles.pastEventTitle}>{event.title}</Text>
        <Text style={styles.pastEventDate}>{event.date}</Text>
      </View>
      <View style={[
        styles.pastEventBadge,
        event.type === 'hosted' ? styles.badgeHosted : styles.badgeAttended
      ]}>
        <Text style={[
          styles.badgeText,
          event.type === 'hosted' ? styles.badgeTextHosted : styles.badgeTextAttended
        ]}>
          {event.type === 'hosted' ? 'Hosted' : 'Went'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setIsSettingsVisible(true)}>
          <Text style={styles.headerBtnText}>⚙️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleEditProfile}>
          <Text style={styles.headerBtnText}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery or Empty State */}
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
            {/* Photo Dots */}
            <View style={styles.photoDots}>
              {user.photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activePhotoIndex === index && styles.dotActive
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          /* Empty Photo State */
          <View style={styles.emptyPhotoSection}>
            <TouchableOpacity style={styles.emptyPhotoCard} onPress={handleEditProfile}>
              <View style={styles.emptyPhotoPlusIcon}>
                <Text style={styles.emptyPhotoPlusText}>+</Text>
              </View>
              <Text style={styles.emptyPhotoTitle}>Add Photos</Text>
              <Text style={styles.emptyPhotoSubtitle}>Add some photos for your profile</Text>
            </TouchableOpacity>
            <View style={styles.photoDots}>
              <View style={[styles.dot, styles.dotActive]} />
            </View>
          </View>
        )}

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Name Row with Action Buttons */}
          <View style={styles.nameRow}>
            <View style={styles.nameInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.age != null && <Text style={styles.userAge}>{user.age}</Text>}
              <Text style={styles.userEmoji}>{user.emoji}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnAddFriend}
                >
                  <Text style={styles.btnAddFriendText}>Add Friend</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnMessage}>
                <Text style={styles.btnMessageText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location - show add button if empty */}
          {user.location ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.addInfoBtn} onPress={handleEditProfile}>
              <Text style={styles.addInfoIcon}>📍</Text>
              <Text style={styles.addInfoText}>+ Add location</Text>
            </TouchableOpacity>
          )}

          {/* College - show add button if empty */}
          {user.college ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎓</Text>
              <Text style={styles.infoText}>{user.college}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.addInfoBtn} onPress={handleEditProfile}>
              <Text style={styles.addInfoIcon}>🎓</Text>
              <Text style={styles.addInfoText}>+ Add college</Text>
            </TouchableOpacity>
          )}

          {/* Bio - show placeholder if empty */}
          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <TouchableOpacity style={styles.emptyBioSection} onPress={handleEditProfile}>
              <Text style={styles.emptyBioIcon}>📝</Text>
              <Text style={styles.emptyBioText}>Tell others about yourself...</Text>
              <Text style={styles.emptyBioAddBtn}>Add bio</Text>
            </TouchableOpacity>
          )}

          {/* Interest Tags - show add button if empty */}
          {user.interests.length > 0 ? (
            <View style={styles.tags}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {interest.emoji} {interest.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyInterestsSection}>
              <Text style={styles.sectionLabel}>INTERESTS</Text>
              <TouchableOpacity style={styles.addInterestBtn} onPress={handleEditProfile}>
                <Text style={styles.addInterestBtnText}>+ Add interests</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, user.stats.followers === 0 && styles.statValueEmpty]}>
                {user.stats.followers}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, user.stats.following === 0 && styles.statValueEmpty]}>
                {user.stats.following}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, user.stats.eventsHosted === 0 && styles.statValueEmpty]}>
                {user.stats.eventsHosted}
              </Text>
              <Text style={styles.statLabel}>Events Hosted</Text>
            </View>
          </View>

          {/* Past Events */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🗓 Past Events</Text>
          </View>

          {user.pastEvents.length > 0 ? (
            <View style={styles.pastEvents}>
              {user.pastEvents.map(renderPastEvent)}
            </View>
          ) : (
            <View style={styles.emptyEventsSection}>
              <Text style={styles.emptyEventsIcon}>🎉</Text>
              <Text style={styles.emptyEventsTitle}>No events yet</Text>
              <Text style={styles.emptyEventsSubtitle}>Events you host or attend will appear here</Text>
            </View>
          )}

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <EditProfileScreen
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          initialData={{
            name: user.name,
            age: user.age || 0,
            location: user.location,
            school: user.college,
            bio: user.bio,
            interests: user.interests,
            photo: user.photos[0],
            showEventsHosted: true,
            showEventsAttended: true,
          }}
          onSave={handleSaveProfile}
        />
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </SafeAreaView>
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
    fontSize: 22,
    opacity: 0.7,
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
  // Profile Content
  profileContent: {
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  // Action Buttons (next to name)
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnAddFriend: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnAddFriendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  btnMessage: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMessageText: {
    fontSize: 16,
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
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
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
  // Past Events
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  pastEvents: {
    gap: 12,
  },
  pastEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pastEventImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  pastEventInfo: {
    flex: 1,
  },
  pastEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  pastEventDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  pastEventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeHosted: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  badgeAttended: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextHosted: {
    color: '#a78bfa',
  },
  badgeTextAttended: {
    color: '#4ade80',
  },
  // Empty Photo State
  emptyPhotoSection: {
    paddingHorizontal: 16,
  },
  emptyPhotoCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyPhotoPlusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotoPlusText: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyPhotoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyPhotoSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
  },
  // Add Info Buttons
  addInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addInfoIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  addInfoText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  // Empty Bio Section
  emptyBioSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  emptyBioIcon: {
    fontSize: 16,
    opacity: 0.4,
  },
  emptyBioText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.35)',
  },
  emptyBioAddBtn: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
  },
  // Empty Interests Section
  emptyInterestsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  addInterestBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  addInterestBtnText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  // Empty Stats
  statValueEmpty: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  // Empty Events Section
  emptyEventsSection: {
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEventsIcon: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyEventsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  emptyEventsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
