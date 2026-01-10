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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { usersService } from '../api/services/users';
import { uploadsService } from '../api/services/uploads';
import { eventsService } from '../api/services/events';
import { ProfileBackground } from '../components/ProfileBackground';
import { DeckCarousel } from '../components/DeckCarousel';
import { InterestsGallery, Interest } from '../components/InterestsGallery';
import { FavoritesSearchModal } from '../components/FavoritesSearchModal';
import { ProfileEventCard, EventTabType } from '../components/ProfileEventCard';
import { PhotoManagementModal } from '../components/PhotoManagementModal';
import { ScreenWrapper } from '../components/ScreenWrapper';
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

// Stagger delay between elements (ms)
const CASCADE_STAGGER = 50;
// Subtle cascade spring config
const CASCADE_SPRING = {
  damping: 18,
  stiffness: 120,
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


interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  photos: string[];
  interests: Interest[];
  profilePicture: string | null;
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
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);

  // Favorites search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchModalType, setSearchModalType] = useState<Interest['type']>('movie');
  const [editingInterestIndex, setEditingInterestIndex] = useState<number>(0);

  // Photo management modal state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // Cascade animation shared values (0 = hidden, 1 = visible)
  const cascade0 = useSharedValue(0); // Profile picture
  const cascade1 = useSharedValue(0); // Name
  const cascade2 = useSharedValue(0); // Bio
  const cascade3 = useSharedValue(0); // Buttons
  const cascade4 = useSharedValue(0); // Photos
  const cascade5 = useSharedValue(0); // My Events
  const cascade6 = useSharedValue(0); // Interests
  const cascade7 = useSharedValue(0); // Add Friend

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
    profilePicture: null as string | null,
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

  // Cascade animated styles - subtle entrance from bottom-right
  const cascadeStyle0 = useAnimatedStyle(() => ({
    opacity: cascade0.value,
    transform: [
      { translateX: 35 * (1 - cascade0.value) },
      { translateY: 20 * (1 - cascade0.value) },
    ],
  }));
  const cascadeStyle1 = useAnimatedStyle(() => ({
    opacity: cascade1.value,
    transform: [
      { translateX: 35 * (1 - cascade1.value) },
      { translateY: 20 * (1 - cascade1.value) },
    ],
  }));
  const cascadeStyle2 = useAnimatedStyle(() => ({
    opacity: cascade2.value,
    transform: [
      { translateX: 35 * (1 - cascade2.value) },
      { translateY: 20 * (1 - cascade2.value) },
    ],
  }));
  const cascadeStyle3 = useAnimatedStyle(() => ({
    opacity: cascade3.value,
    transform: [
      { translateX: 35 * (1 - cascade3.value) },
      { translateY: 20 * (1 - cascade3.value) },
    ],
  }));
  const cascadeStyle4 = useAnimatedStyle(() => ({
    opacity: cascade4.value,
    transform: [
      { translateX: 35 * (1 - cascade4.value) },
      { translateY: 20 * (1 - cascade4.value) },
    ],
  }));
  const cascadeStyle5 = useAnimatedStyle(() => ({
    opacity: cascade5.value,
    transform: [
      { translateX: 35 * (1 - cascade5.value) },
      { translateY: 20 * (1 - cascade5.value) },
    ],
  }));
  const cascadeStyle6 = useAnimatedStyle(() => ({
    opacity: cascade6.value,
    transform: [
      { translateX: 35 * (1 - cascade6.value) },
      { translateY: 20 * (1 - cascade6.value) },
    ],
  }));
  const cascadeStyle7 = useAnimatedStyle(() => ({
    opacity: cascade7.value,
    transform: [
      { translateX: 35 * (1 - cascade7.value) },
      { translateY: 20 * (1 - cascade7.value) },
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

  // Replay cascade animation when screen is focused (tab switch)
  // Uses withSequence to smoothly fade out then cascade in, avoiding black screen bug
  useFocusEffect(
    useCallback(() => {
      const FADE_OUT_DURATION = 50; // Quick fade out to avoid black screen

      // Animate out smoothly, then cascade back in
      // This prevents the instant opacity=0 that causes black screens
      cascade0.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(0 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade1.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(1 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade2.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(2 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade3.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(3 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade4.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(4 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade5.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(5 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade6.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(6 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
      cascade7.value = withSequence(
        withTiming(0, { duration: FADE_OUT_DURATION }),
        withDelay(7 * CASCADE_STAGGER, withSpring(1, CASCADE_SPRING))
      );
    }, [])
  );

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

      // Use user's photos or empty array
      const photos = apiUser.photos || [];

      setUser({
        id: apiUser.id,
        firstName,
        lastName,
        bio: apiUser.bio || '',
        photos,
        interests: sampleInterests,
        profilePicture: apiUser.avatar || null,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use empty data on error
      setUser({
        id: '0',
        firstName: '',
        lastName: '',
        bio: '',
        photos: [],
        interests: sampleInterests,
        profilePicture: null,
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
      profilePicture: user.profilePicture,
    });

    // Initialize edit fields
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditBio(user.bio);
    setEditPhotos([...user.photos]);
    setEditInterests([...user.interests]);
    setEditProfilePicture(user.profilePicture);

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
      profilePicture: editProfilePicture,
    });

    // Animate out then exit edit mode
    animateOut(() => {
      setIsEditMode(false);
      resetAnimations();
    });

    // Persist to backend
    try {
      let avatarUrl = user.profilePicture;

      // Check if profile picture changed and needs upload
      if (editProfilePicture && editProfilePicture !== user.profilePicture) {
        // If it's a local file URI, upload it first
        if (editProfilePicture.startsWith('file://')) {
          const uploadResult = await uploadsService.uploadImage(editProfilePicture);
          avatarUrl = uploadResult.url;
        } else {
          avatarUrl = editProfilePicture;
        }
      }

      await usersService.updateProfile({
        name: `${editFirstName} ${editLastName}`.trim(),
        bio: editBio,
        photos: editPhotos,
        avatar: avatarUrl,
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
    setEditProfilePicture(originalValues.profilePicture);

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

  const handleOpenPhotoModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoModalVisible(true);
  };

  const handleSavePhotos = async (newPhotos: string[]) => {
    if (user) {
      setUser({ ...user, photos: newPhotos });
      setEditPhotos(newPhotos);

      // Persist to backend immediately
      try {
        await usersService.updateProfile({ photos: newPhotos });
      } catch (error) {
        console.error('Failed to save photos:', error);
      }
    }
  };

  const handleChangeProfilePicture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to change your profile picture.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPictureUri = result.assets[0].uri;

      if (isEditMode) {
        // If in edit mode, just update the edit state (will be uploaded on save)
        setEditProfilePicture(newPictureUri);
      } else {
        // If not in edit mode, upload and save directly to the server
        try {
          // Upload the image first
          const uploadResult = await uploadsService.uploadImage(newPictureUri);
          // Save the uploaded URL to profile
          await usersService.updateProfile({ avatar: uploadResult.url });
          // Refresh user data
          fetchProfile();
        } catch (error) {
          console.error('Failed to update profile picture:', error);
          alert('Failed to update profile picture. Please try again.');
        }
      }
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
  const displayProfilePicture = isEditMode ? editProfilePicture : user.profilePicture;

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

      {/* Settings Button (hidden in edit mode) */}
      {!isEditMode && (
        <TouchableOpacity style={styles.settingsButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <BlurView intensity={12} tint="light" style={styles.settingsButtonBlur}>
            <Text style={styles.settingsButtonIcon}>⚙️</Text>
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
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Large Centered Profile Picture */}
          <Animated.View style={[styles.profilePictureSection, cascadeStyle0]}>
            <TouchableOpacity
              style={styles.largeProfilePicContainer}
              onPress={handleChangeProfilePicture}
              activeOpacity={0.7}
            >
              {displayProfilePicture ? (
                <Image
                  source={{ uri: displayProfilePicture }}
                  style={styles.largeProfilePic}
                />
              ) : (
                <View style={styles.largeProfilePicPlaceholder}>
                  <View style={styles.largeSilhouetteHead} />
                  <View style={styles.largeSilhouetteBody} />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Text style={styles.cameraButtonIcon}>📷</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Centered Name (First + Last on one line) */}
          {showEditContent ? (
            <Animated.View style={[styles.editFieldContainer, firstNameAnimStyle]}>
              <TextInput
                style={styles.profileNameInputCentered}
                value={`${editFirstName} ${editLastName}`}
                onChangeText={(text) => {
                  const parts = text.split(' ');
                  setEditFirstName(parts[0] || '');
                  setEditLastName(parts.slice(1).join(' ') || '');
                }}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </Animated.View>
          ) : (
            <Animated.View style={cascadeStyle1}>
              <Text style={styles.profileNameCentered}>{displayFirstName} {displayLastName}</Text>
            </Animated.View>
          )}

          {/* Bio Centered */}
          {showEditContent ? (
            <Animated.View style={[styles.editFieldContainer, bioAnimStyle]}>
              <TextInput
                style={styles.descriptionInputCentered}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell others about yourself..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={4}
              />
            </Animated.View>
          ) : (
            <Animated.View style={cascadeStyle2}>
              <Text style={styles.descriptionCentered}>{displayBio}</Text>
            </Animated.View>
          )}

          {/* Edit Profile & Share Profile Buttons */}
          {!isEditMode && (
            <Animated.View style={[styles.profileButtonsRow, cascadeStyle3]}>
              <TouchableOpacity style={styles.editProfileButtonInline} onPress={handleEditPress}>
                <Text style={styles.profileButtonText}>Edit profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareProfileButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Text style={styles.profileButtonText}>Share profile</Text>
              </TouchableOpacity>
            </Animated.View>
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

          {/* Photos Carousel Section */}
          <Animated.View style={[styles.photosSection, cascadeStyle4]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📸</Text>
              <Text style={styles.sectionTitle}>Photos</Text>
              <TouchableOpacity style={styles.addPhotosButtonSmall} onPress={handleOpenPhotoModal}>
                <Text style={styles.addPhotosButtonSmallText}>
                  {displayPhotos.length === 0 ? '+ Add' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>
            {displayPhotos.length > 0 ? (
              showEditContent ? (
                <Animated.View style={carouselAnimStyle}>
                  <DeckCarousel
                    photos={displayPhotos}
                    isEditMode={isEditMode}
                    showAddButton={false}
                    onRemovePhoto={handleRemovePhoto}
                  />
                </Animated.View>
              ) : (
                <DeckCarousel
                  photos={displayPhotos}
                  isEditMode={false}
                  showAddButton={false}
                />
              )
            ) : (
              <View style={styles.emptyPhotosState}>
                <Text style={styles.emptyPhotosIcon}>📷</Text>
                <Text style={styles.emptyPhotosText}>No photos yet</Text>
                <TouchableOpacity style={styles.addFirstPhotoButton} onPress={handleOpenPhotoModal}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addFirstPhotoGradient}
                  >
                    <Text style={styles.addFirstPhotoText}>+ Add Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* My Events Section */}
          {!isEditMode && (
            <Animated.View style={[styles.myEventsSection, cascadeStyle5]}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📅</Text>
                <Text style={styles.sectionTitle}>My Events</Text>
              </View>

              {/* Event Tabs */}
              <View style={styles.eventTabsContainer}>
                {/* Going Tab */}
                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'going' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('going')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.eventTabText,
                    activeEventTab === 'going' && styles.eventTabTextActive,
                  ]}>Going</Text>
                </TouchableOpacity>

                {/* Interested Tab */}
                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'interested' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('interested')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.eventTabText,
                    activeEventTab === 'interested' && styles.eventTabTextActive,
                  ]}>Interested</Text>
                </TouchableOpacity>

                {/* Hosting Tab */}
                <TouchableOpacity
                  style={[
                    styles.eventTab,
                    activeEventTab === 'hosting' && styles.eventTabActive,
                  ]}
                  onPress={() => handleEventTabChange('hosting')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.eventTabText,
                    activeEventTab === 'hosting' && styles.eventTabTextActive,
                  ]}>Hosting</Text>
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
            </Animated.View>
          )}

          {/* Interests Gallery */}
          <Animated.View style={cascadeStyle6}>
            <InterestsGallery
              interests={isEditMode ? editInterests : user.interests}
              isEditMode={isEditMode}
              onInterestPress={handleInterestPress}
            />
          </Animated.View>

          {/* Add Friend Button (hidden in edit mode) */}
          {!isEditMode && (
            <Animated.View style={[styles.ctaSection, cascadeStyle7]}>
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
            </Animated.View>
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

      {/* Photo Management Modal */}
      <PhotoManagementModal
        visible={photoModalVisible}
        photos={user.photos}
        onClose={() => setPhotoModalVisible(false)}
        onSave={handleSavePhotos}
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
  // Settings Button (top right)
  settingsButton: {
    position: 'absolute',
    top: 68,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 50,
  },
  settingsButtonBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  settingsButtonIcon: {
    fontSize: 20,
  },
  // Scroll View
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 120,
  },
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
  },
  // Large Centered Profile Picture
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeProfilePicContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
  },
  largeProfilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  largeProfilePicPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    backgroundColor: 'rgba(60, 60, 70, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  largeSilhouetteHead: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(100, 100, 110, 0.9)',
    marginBottom: -10,
  },
  largeSilhouetteBody: {
    width: 80,
    height: 50,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: 'rgba(100, 100, 110, 0.9)',
    marginTop: 6,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0f',
  },
  cameraButtonIcon: {
    fontSize: 18,
  },
  editFieldContainer: {
    width: '100%',
  },
  // Centered Name (single line)
  profileNameCentered: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  profileNameInputCentered: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
  },
  descriptionCentered: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  descriptionInputCentered: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  // Profile Buttons Row (Edit & Share)
  profileButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  editProfileButtonInline: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  shareProfileButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Photos Section
  photosSection: {
    marginBottom: 24,
  },
  addPhotosButtonSmall: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  addPhotosButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyPhotosState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyPhotosIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyPhotosText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 20,
  },
  addFirstPhotoButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addFirstPhotoGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  addFirstPhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
    gap: 10,
    marginBottom: 16,
  },
  eventTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(30, 30, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  eventTabActive: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  eventTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  eventTabTextActive: {
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
