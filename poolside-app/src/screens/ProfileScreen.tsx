import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { usersService } from '../api/services/users';
import { eventsService } from '../api/services/events';
import { ProfileBackground } from '../components/ProfileBackground';
import { DeckCarousel } from '../components/DeckCarousel';
import { InterestsGallery, Interest } from '../components/InterestsGallery';
import { FavoritesSearchModal } from '../components/FavoritesSearchModal';
import { ProfileEventCard, EventTabType } from '../components/ProfileEventCard';
import { useRsvp } from '../context/RsvpContext';
import { useAuth } from '../context/AuthContext';
import { mapApiEventsToEvents } from '../utils';
import { Event } from '../types';
import { ApiEvent } from '../api';

// Spring config for bubbly animation
const BUBBLE_SPRING_CONFIG = {
  damping: 12,
  stiffness: 180,
  mass: 0.8,
};

const { width, height } = Dimensions.get('window');

// Sample interests data matching the mockup
const sampleInterests: Interest[] = [
  {
    type: 'movie',
    title: 'Dune: Part Two',
    year: '2024',
    image: 'https://image.tmdb.org/t/p/w300/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
  },
  {
    type: 'artist',
    name: 'Frank Ocean',
    image: 'https://i.scdn.co/image/ab6761610000e5ebee3123e593174208f9754fab',
  },
  {
    type: 'food',
    name: 'Omakase Sushi',
    cuisine: 'Japanese',
    emoji: '🍣',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  },
  {
    type: 'song',
    title: 'Pink + White',
    artist: 'Frank Ocean',
    image: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
  },
  {
    type: 'sport',
    name: 'Tennis',
    level: 'competitive',
    emoji: '🎾',
  },
];

// Sample photos for the carousel
const samplePhotos = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=85',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=85',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=85',
];

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  photos: string[];
  interests: Interest[];
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Edit mode state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editInterests, setEditInterests] = useState<Interest[]>([]);

  // Favorites search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchModalType, setSearchModalType] = useState<Interest['type']>('movie');
  const [editingInterestIndex, setEditingInterestIndex] = useState<number>(0);

  // My Events tab state
  const [activeEventTab, setActiveEventTab] = useState<EventTabType>('going');
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [isLoadingHosting, setIsLoadingHosting] = useState(false);
  const tabSlideAnim = useRef(new RNAnimated.Value(0)).current;
  const eventsOpacity = useRef(new RNAnimated.Value(1)).current;

  // Get RSVP data
  const { getEventsByStatus, isLoading: isLoadingRsvp } = useRsvp();
  const { user: authUser } = useAuth();

  // Original values for cancel
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    photos: [] as string[],
    interests: [] as Interest[],
  });

  // Animation state - tracks if edit content should be shown
  const [showEditContent, setShowEditContent] = useState(false);

  // Animation shared values for each field (0 = hidden, 1 = visible)
  const carouselAnim = useSharedValue(0);
  const firstNameAnim = useSharedValue(0);
  const lastNameAnim = useSharedValue(0);
  const bioAnim = useSharedValue(0);
  const buttonsAnim = useSharedValue(0);

  // Animated styles for carousel
  const carouselAnimStyle = useAnimatedStyle(() => ({
    opacity: carouselAnim.value,
    transform: [
      { scale: 0.85 + (carouselAnim.value * 0.15) },
      { translateY: 10 - (carouselAnim.value * 10) },
    ],
  }));

  // Animated styles for first name input
  const firstNameAnimStyle = useAnimatedStyle(() => ({
    opacity: firstNameAnim.value,
    transform: [
      { scale: 0.85 + (firstNameAnim.value * 0.15) },
      { translateY: 10 - (firstNameAnim.value * 10) },
    ],
  }));

  // Animated styles for last name input
  const lastNameAnimStyle = useAnimatedStyle(() => ({
    opacity: lastNameAnim.value,
    transform: [
      { scale: 0.85 + (lastNameAnim.value * 0.15) },
      { translateY: 10 - (lastNameAnim.value * 10) },
    ],
  }));

  // Animated styles for bio input
  const bioAnimStyle = useAnimatedStyle(() => ({
    opacity: bioAnim.value,
    transform: [
      { scale: 0.85 + (bioAnim.value * 0.15) },
      { translateY: 10 - (bioAnim.value * 10) },
    ],
  }));

  // Animated styles for action buttons
  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsAnim.value,
    transform: [
      { scale: 0.85 + (buttonsAnim.value * 0.15) },
      { translateY: 10 - (buttonsAnim.value * 10) },
    ],
  }));

  // Trigger enter animation
  const animateIn = () => {
    setShowEditContent(true);
    carouselAnim.value = withDelay(0, withSpring(1, BUBBLE_SPRING_CONFIG));
    firstNameAnim.value = withDelay(80, withSpring(1, BUBBLE_SPRING_CONFIG));
    lastNameAnim.value = withDelay(160, withSpring(1, BUBBLE_SPRING_CONFIG));
    bioAnim.value = withDelay(240, withSpring(1, BUBBLE_SPRING_CONFIG));
    buttonsAnim.value = withDelay(320, withSpring(1, BUBBLE_SPRING_CONFIG));
  };

  // Trigger exit animation
  const animateOut = (callback: () => void) => {
    const exitDuration = 200;
    const exitConfig = { duration: exitDuration, easing: Easing.out(Easing.ease) };

    buttonsAnim.value = withDelay(0, withTiming(0, exitConfig));
    bioAnim.value = withDelay(40, withTiming(0, exitConfig));
    lastNameAnim.value = withDelay(80, withTiming(0, exitConfig));
    firstNameAnim.value = withDelay(120, withTiming(0, exitConfig));
    carouselAnim.value = withDelay(160, withTiming(0, exitConfig, () => {
      runOnJS(callback)();
    }));
  };

  // Reset animation values
  const resetAnimations = () => {
    carouselAnim.value = 0;
    firstNameAnim.value = 0;
    lastNameAnim.value = 0;
    bioAnim.value = 0;
    buttonsAnim.value = 0;
    setShowEditContent(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch hosting events
  const fetchHostingEvents = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      setIsLoadingHosting(true);
      const response = await eventsService.getEvents({ hostId: authUser.id });
      const mappedEvents = mapApiEventsToEvents(response.events);
      setHostingEvents(mappedEvents);
    } catch (error) {
      console.error('Failed to fetch hosting events:', error);
      setHostingEvents([]);
    } finally {
      setIsLoadingHosting(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchHostingEvents();
  }, [fetchHostingEvents]);

  // Get events based on active tab
  const getActiveEvents = useCallback((): Event[] => {
    switch (activeEventTab) {
      case 'going': {
        const goingApiEvents = getEventsByStatus('going');
        return goingApiEvents.length > 0 ? mapApiEventsToEvents(goingApiEvents) : [];
      }
      case 'interested': {
        const interestedApiEvents = getEventsByStatus('interested');
        return interestedApiEvents.length > 0 ? mapApiEventsToEvents(interestedApiEvents) : [];
      }
      case 'hosting':
        return hostingEvents;
      default:
        return [];
    }
  }, [activeEventTab, getEventsByStatus, hostingEvents]);

  // Get event counts for tabs
  const getEventCounts = useCallback(() => {
    const goingEvents = getEventsByStatus('going');
    const interestedEvents = getEventsByStatus('interested');
    return {
      going: goingEvents.length,
      interested: interestedEvents.length,
      hosting: hostingEvents.length,
    };
  }, [getEventsByStatus, hostingEvents]);

  // Handle tab change with animation
  const handleEventTabChange = (tab: EventTabType) => {
    if (tab === activeEventTab) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Calculate tab index for slide animation
    const tabIndex = tab === 'going' ? 0 : tab === 'interested' ? 1 : 2;

    // Animate tab indicator
    RNAnimated.spring(tabSlideAnim, {
      toValue: tabIndex,
      stiffness: 300,
      damping: 25,
      mass: 1,
      useNativeDriver: true,
    }).start();

    // Fade out, change content, fade in
    RNAnimated.timing(eventsOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setActiveEventTab(tab);
      RNAnimated.timing(eventsOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const activeEvents = getActiveEvents();
  const eventCounts = getEventCounts();
  const isLoadingEvents = isLoadingRsvp || isLoadingHosting;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const apiUser = await usersService.getMe();

      // Parse name into first and last
      const nameParts = apiUser.name.split(' ');
      const firstName = nameParts[0] || 'Sarah';
      const lastName = nameParts.slice(1).join(' ') || 'Mitchell';

      // Use sample data for demo, will use API data in production
      const photos = apiUser.avatar ? [apiUser.avatar] : samplePhotos;

      setUser({
        id: apiUser.id,
        firstName,
        lastName,
        bio: apiUser.bio || "First-time cruiser loving every moment! Here for the sunset deck parties, trivia nights, and making new friends. Always down for poolside hangs or exploring ports together. Let's make this voyage unforgettable!",
        photos,
        interests: sampleInterests,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use sample data on error
      setUser({
        id: '0',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        bio: "First-time cruiser loving every moment! Here for the sunset deck parties, trivia nights, and making new friends. Always down for poolside hangs or exploring ports together. Let's make this voyage unforgettable!",
        photos: samplePhotos,
        interests: sampleInterests,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isEditMode) {
      handleCancel();
    } else {
      navigation.goBack();
    }
  };

  const handleEditPress = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Store original values
    setOriginalValues({
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      photos: [...user.photos],
      interests: [...user.interests],
    });

    // Initialize edit fields
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditBio(user.bio);
    setEditPhotos([...user.photos]);
    setEditInterests([...user.interests]);

    setIsEditMode(true);
    animateIn();
  };

  const handleSave = async () => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Update local state
    setUser({
      ...user,
      firstName: editFirstName,
      lastName: editLastName,
      bio: editBio,
      photos: editPhotos,
      interests: editInterests,
    });

    // Animate out then exit edit mode
    animateOut(() => {
      setIsEditMode(false);
      resetAnimations();
    });

    // Persist to backend
    try {
      await usersService.updateProfile({
        name: `${editFirstName} ${editLastName}`.trim(),
        bio: editBio,
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Restore original values
    setEditFirstName(originalValues.firstName);
    setEditLastName(originalValues.lastName);
    setEditBio(originalValues.bio);
    setEditPhotos(originalValues.photos);
    setEditInterests(originalValues.interests);

    // Animate out then exit edit mode
    animateOut(() => {
      setIsEditMode(false);
      resetAnimations();
    });
  };

  const handleRemovePhoto = (index: number) => {
    if (editPhotos.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditPhotos(editPhotos.filter((_, i) => i !== index));
  };

  const handleAddPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to add photos.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditPhotos([...editPhotos, result.assets[0].uri]);
    }
  };

  const handleMessagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to messages
  };

  const handleAddFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add friend logic
  };

  const handleInterestPress = (index: number, type: Interest['type']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingInterestIndex(index);
    setSearchModalType(type);
    setSearchModalVisible(true);
  };

  const handleInterestSelect = (interest: Interest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedInterests = [...editInterests];
    updatedInterests[editingInterestIndex] = interest;
    setEditInterests(updatedInterests);
    setSearchModalVisible(false);
  };

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ProfileBackground />
        <ActivityIndicator size="large" color="#FF8C00" style={{ zIndex: 10 }} />
      </View>
    );
  }

  const displayPhotos = isEditMode ? editPhotos : user.photos;
  const displayFirstName = isEditMode ? editFirstName : user.firstName;
  const displayLastName = isEditMode ? editLastName : user.lastName;
  const displayBio = isEditMode ? editBio : user.bio;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Lottie Background Layer */}
      <ProfileBackground />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <BlurView intensity={80} tint="light" style={styles.blurButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </BlurView>
      </TouchableOpacity>

      {/* Edit Profile Button (hidden in edit mode) */}
      {!isEditMode && (
        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditPress}>
          <BlurView intensity={12} tint="light" style={styles.editProfileBlur}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </BlurView>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Photo Carousel */}
        <View style={styles.carouselSection}>
          {showEditContent ? (
            <Animated.View style={carouselAnimStyle}>
              <DeckCarousel
                photos={displayPhotos}
                isEditMode={isEditMode}
                onRemovePhoto={handleRemovePhoto}
                onAddPhoto={handleAddPhoto}
              />
            </Animated.View>
          ) : (
            <DeckCarousel
              photos={displayPhotos}
              isEditMode={isEditMode}
              onRemovePhoto={handleRemovePhoto}
              onAddPhoto={handleAddPhoto}
            />
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Name Header */}
          <View style={styles.profileHeader}>
            {showEditContent ? (
              <Animated.View style={[styles.editFieldContainer, firstNameAnimStyle]}>
                <TextInput
                  style={styles.profileNameInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </Animated.View>
            ) : (
              <Text style={styles.profileName}>{displayFirstName}</Text>
            )}

            {!isEditMode && (
              <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Last Name */}
          {showEditContent ? (
            <Animated.View style={[styles.editFieldContainer, lastNameAnimStyle]}>
              <TextInput
                style={styles.profileLastNameInput}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Last Name"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </Animated.View>
          ) : (
            <Text style={styles.profileLastName}>{displayLastName}</Text>
          )}

          {/* Description */}
          {showEditContent ? (
            <Animated.View style={[styles.editFieldContainer, bioAnimStyle]}>
              <TextInput
                style={styles.descriptionInput}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell others about yourself..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={4}
              />
            </Animated.View>
          ) : (
            <Text style={styles.description}>{displayBio}</Text>
          )}

          {/* Edit Actions */}
          {showEditContent && (
            <Animated.View style={[styles.editActions, buttonsAnimStyle]}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* My Events Section */}
          {!isEditMode && (
            <View style={styles.myEventsSection}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📅</Text>
                <Text style={styles.sectionTitle}>My Events</Text>
              </View>

              {/* Event Tabs */}
              <View style={styles.eventTabsContainer}>
                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'going' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('going')}
                  activeOpacity={0.7}
                >
                  {activeEventTab === 'going' ? (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventTabGradient}
                    >
                      <Text style={styles.eventTabTextActive}>Going</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.going}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.eventTabInner}>
                      <Text style={styles.eventTabText}>Going</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.going}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'interested' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('interested')}
                  activeOpacity={0.7}
                >
                  {activeEventTab === 'interested' ? (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventTabGradient}
                    >
                      <Text style={styles.eventTabTextActive}>Interested</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.interested}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.eventTabInner}>
                      <Text style={styles.eventTabText}>Interested</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.interested}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'hosting' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('hosting')}
                  activeOpacity={0.7}
                >
                  {activeEventTab === 'hosting' ? (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventTabGradient}
                    >
                      <Text style={styles.eventTabTextActive}>Hosting</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.hosting}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.eventTabInner}>
                      <Text style={styles.eventTabText}>Hosting</Text>
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{eventCounts.hosting}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Events List */}
              <RNAnimated.View style={[styles.eventsList, { opacity: eventsOpacity }]}>
                {isLoadingEvents ? (
                  <View style={styles.eventsLoading}>
                    <ActivityIndicator size="small" color="#667eea" />
                  </View>
                ) : activeEvents.length === 0 ? (
                  <View style={styles.emptyEvents}>
                    <Text style={styles.emptyEventsEmoji}>
                      {activeEventTab === 'hosting' ? '🎉' : '📅'}
                    </Text>
                    <Text style={styles.emptyEventsTitle}>
                      No {activeEventTab} events yet
                    </Text>
                    <Text style={styles.emptyEventsText}>
                      {activeEventTab === 'hosting'
                        ? 'Create your first event to start hosting!'
                        : 'Browse events and tap RSVP to get started'}
                    </Text>
                  </View>
                ) : (
                  activeEvents.map((event) => (
                    <ProfileEventCard
                      key={event.id}
                      event={event}
                      status={activeEventTab}
                    />
                  ))
                )}
              </RNAnimated.View>
            </View>
          )}

          {/* Interests Gallery */}
          <InterestsGallery
            interests={isEditMode ? editInterests : user.interests}
            isEditMode={isEditMode}
            onInterestPress={handleInterestPress}
          />

          {/* Add Friend Button (hidden in edit mode) */}
          {!isEditMode && (
            <View style={styles.ctaSection}>
              <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addFriendGradient}
                >
                  <Text style={styles.addFriendText}>Add Friend</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Favorites Search Modal */}
      <FavoritesSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={handleInterestSelect}
        type={searchModalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F6',  // Warm white base (matches background)
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F6',  // Warm white base (matches background)
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Back Button
  backButton: {
    position: 'absolute',
    top: 68,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 50,
  },
  blurButton: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
  // Edit Profile Button
  editProfileButton: {
    position: 'absolute',
    top: 68,
    right: 24,
    borderRadius: 100,
    overflow: 'hidden',
    zIndex: 50,
  },
  editProfileBlur: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  // Scroll View
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 120,
  },
  // Carousel
  carouselSection: {
    marginBottom: 20,
  },
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
  },
  editFieldContainer: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  profileName: {
    fontFamily: 'System',
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 46,
  },
  profileNameInput: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  messageButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  profileLastName: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  profileLastNameInput: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.5,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  // Edit Actions
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // CTA Section
  ctaSection: {
    paddingBottom: 40,
  },
  addFriendButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addFriendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  addFriendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // My Events Section
  myEventsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  eventTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  eventTab: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  eventTabActive: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  eventTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 50,
  },
  eventTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  eventTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  eventTabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  eventsList: {
    minHeight: 100,
  },
  eventsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEventsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyEventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  emptyEventsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
  },
});
