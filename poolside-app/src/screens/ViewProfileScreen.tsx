import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated as RNAnimated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { usersService } from '../api/services/users';
import { eventsService } from '../api/services/events';
import { ProfileBackground } from '../components/ProfileBackground';
import { DeckCarousel } from '../components/DeckCarousel';
import { InterestsGallery, Interest } from '../components/InterestsGallery';
import { ProfileEventCard, EventTabType } from '../components/ProfileEventCard';
import { MainStackParamList } from '../navigation/MainNavigator';
import { mapApiEventsToEvents } from '../utils';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRsvp } from '../context/RsvpContext';

// Stagger delay between elements (ms)
const CASCADE_STAGGER = 50;
// Subtle cascade spring config
const CASCADE_SPRING = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
};

const { width } = Dimensions.get('window');

type ViewProfileRouteProp = RouteProp<MainStackParamList, 'ViewProfile'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Sample interests data (placeholder until API supports it)
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
];

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  photos: string[];
  interests: Interest[];
  profilePicture: string | null;
  isOnline: boolean;
}

export const ViewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewProfileRouteProp>();
  const { userId } = route.params;

  // Auth and RSVP context
  const { user: currentUser } = useAuth();
  const { getEventsByStatus, isLoading: isLoadingRsvp } = useRsvp();

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // My Events tab state
  const [activeEventTab, setActiveEventTab] = useState<EventTabType>('going');
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [goingEvents, setGoingEvents] = useState<Event[]>([]);
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const tabSlideAnim = useRef(new RNAnimated.Value(0)).current;
  const eventsOpacity = useRef(new RNAnimated.Value(1)).current;

  // Cascade animation shared values
  const cascade0 = useSharedValue(0);
  const cascade1 = useSharedValue(0);
  const cascade2 = useSharedValue(0);
  const cascade3 = useSharedValue(0);
  const cascade4 = useSharedValue(0);
  const cascade5 = useSharedValue(0);
  const cascade6 = useSharedValue(0);

  // Cascade animated styles
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

  useEffect(() => {
    fetchUserProfile();
    fetchUserEvents();
  }, [userId]);

  // Play cascade animation when screen is focused
  useFocusEffect(
    useCallback(() => {
      const FADE_OUT_DURATION = 50;

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
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const apiUser = await usersService.getUserById(userId);

      // Parse name into first and last
      const nameParts = apiUser.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setUser({
        id: apiUser.id,
        firstName,
        lastName,
        bio: (apiUser as any).bio || '',
        photos: apiUser.photos || [],
        interests: sampleInterests,
        profilePicture: apiUser.avatar || null,
        isOnline: apiUser.isOnline,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      setIsLoadingEvents(true);
      // Fetch events hosted by this user
      const response = await eventsService.getEvents({ hostId: userId });
      const mappedEvents = mapApiEventsToEvents(response.events);
      setHostingEvents(mappedEvents);
      // TODO: Fetch going/interested events when API supports it
      setGoingEvents([]);
      setInterestedEvents([]);
    } catch (error) {
      console.error('Failed to fetch user events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const getActiveEvents = useCallback((): Event[] => {
    switch (activeEventTab) {
      case 'going': {
        // If viewing own profile, use RSVP context
        if (isOwnProfile) {
          const goingApiEvents = getEventsByStatus('going');
          return goingApiEvents.length > 0 ? mapApiEventsToEvents(goingApiEvents) : [];
        }
        return goingEvents;
      }
      case 'interested': {
        // If viewing own profile, use RSVP context
        if (isOwnProfile) {
          const interestedApiEvents = getEventsByStatus('interested');
          return interestedApiEvents.length > 0 ? mapApiEventsToEvents(interestedApiEvents) : [];
        }
        return interestedEvents;
      }
      case 'hosting':
        return hostingEvents;
      default:
        return [];
    }
  }, [activeEventTab, goingEvents, interestedEvents, hostingEvents, isOwnProfile, getEventsByStatus]);

  const handleEventTabChange = (tab: EventTabType) => {
    if (tab === activeEventTab) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const tabIndex = tab === 'going' ? 0 : tab === 'interested' ? 1 : 2;

    RNAnimated.spring(tabSlideAnim, {
      toValue: tabIndex,
      stiffness: 300,
      damping: 25,
      mass: 1,
      useNativeDriver: true,
    }).start();

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

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement follow
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const activeEvents = getActiveEvents();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ProfileBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <ProfileBackground />
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <BlurView intensity={80} tint="light" style={styles.blurButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </BlurView>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Animated Background */}
      <ProfileBackground />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <BlurView intensity={80} tint="light" style={styles.blurButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </BlurView>
      </TouchableOpacity>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Large Centered Profile Picture */}
          <Animated.View style={[styles.profilePictureSection, cascadeStyle0]}>
            <View style={styles.largeProfilePicContainer}>
              {user.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.largeProfilePic}
                />
              ) : (
                <View style={styles.largeProfilePicPlaceholder}>
                  <View style={styles.largeSilhouetteHead} />
                  <View style={styles.largeSilhouetteBody} />
                </View>
              )}
              {user.isOnline && <View style={styles.onlineIndicator} />}
            </View>
          </Animated.View>

          {/* Centered Name */}
          <Animated.View style={cascadeStyle1}>
            <Text style={styles.profileNameCentered}>
              {user.firstName} {user.lastName}
            </Text>
          </Animated.View>

          {/* Bio Centered */}
          {user.bio ? (
            <Animated.View style={cascadeStyle2}>
              <Text style={styles.descriptionCentered}>{user.bio}</Text>
            </Animated.View>
          ) : null}

          {/* Follow Button - only show for other users */}
          {!isOwnProfile && (
            <Animated.View style={[styles.profileButtonsRow, cascadeStyle3]}>
              <TouchableOpacity style={styles.followButtonFull} onPress={handleFollow}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.followGradient}
                >
                  <Text style={styles.followButtonText}>Follow</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Photos Carousel Section */}
          {user.photos.length > 0 && (
            <Animated.View style={[styles.photosSection, cascadeStyle4]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📸</Text>
                <Text style={styles.sectionTitle}>Photos</Text>
              </View>
              <DeckCarousel
                photos={user.photos}
                isEditMode={false}
                showAddButton={false}
              />
            </Animated.View>
          )}

          {/* Events Section */}
          <Animated.View style={[styles.myEventsSection, cascadeStyle5]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📅</Text>
              <Text style={styles.sectionTitle}>Events</Text>
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
                <Text style={[
                  styles.eventTabText,
                  activeEventTab === 'going' && styles.eventTabTextActive,
                ]}>Going</Text>
              </TouchableOpacity>

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
              {(isLoadingEvents || (isOwnProfile && isLoadingRsvp)) ? (
                <View style={styles.eventsLoading}>
                  <ActivityIndicator size="small" color="#667eea" />
                </View>
              ) : activeEvents.length === 0 ? (
                <View style={styles.emptyEvents}>
                  <Text style={styles.emptyEventsEmoji}>
                    {activeEventTab === 'hosting' ? '🎉' : '📅'}
                  </Text>
                  <Text style={styles.emptyEventsTitle}>
                    No {activeEventTab} events
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

          {/* Interests Gallery */}
          <Animated.View style={cascadeStyle6}>
            <InterestsGallery
              interests={user.interests}
              isEditMode={false}
              onInterestPress={() => {}}
            />
          </Animated.View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#0a0a0f',
  },
  // Centered Name
  profileNameCentered: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
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
  // Profile Buttons Row (Follow & Message)
  profileButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  followButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  followButtonFull: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 200,
  },
  followGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  messageButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Photos Section
  photosSection: {
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
  // My Events Section
  myEventsSection: {
    marginTop: 24,
    marginBottom: 24,
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
});
