import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  withDelay,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { EventCard, EventDetailModal, EventFilterModal } from '../components';
import { mockEvents } from '../data/mockEvents';
import { Event } from '../types';
import { useEvents } from '../hooks';
import { mapApiEventsToEvents } from '../utils';
import {
  EventFilterState,
  DEFAULT_FILTER_STATE,
  countActiveFilters,
} from '../data/eventFilters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Layout constants
const HEADER_HEIGHT = 110; // Logo + title area
const TAB_BAR_HEIGHT = 85; // Bottom tab bar
const STAGGER_DELAY = 120; // ms between each card for entrance animation

// Spring config matching the original FadeInUp animation
const ENTRANCE_SPRING = { damping: 12, stiffness: 100, mass: 0.8 };

// Animated Event Card wrapper with scale effect
interface AnimatedEventCardProps {
  event: Event;
  index: number;
  scrollY: Animated.SharedValue<number>;
  cardHeight: number;
  onPress: () => void;
  trigger: SharedValue<number>;
  isInitialMount: boolean;
}

const AnimatedEventCard: React.FC<AnimatedEventCardProps> = ({
  event,
  index,
  scrollY,
  cardHeight,
  onPress,
  trigger,
  isInitialMount,
}) => {
  // Entrance animation shared values (replaces FadeInUp entering prop)
  const entranceOpacity = useSharedValue(0);
  const entranceTranslateY = useSharedValue(50);

  // Trigger entrance animation when trigger changes (on tab focus)
  // Runs on UI thread - no React state, no delay
  useAnimatedReaction(
    () => trigger.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        // Calculate which card is currently visible based on scroll position
        const currentScrollY = scrollY.value;
        const firstVisibleIndex = Math.floor(currentScrollY / cardHeight);

        // Cards above viewport: instant (no delay)
        // Cards at/below viewport: stagger from first visible
        const isAboveViewport = index < firstVisibleIndex;

        if (isAboveViewport) {
          // Instant - already scrolled past these
          entranceOpacity.value = 1;
          entranceTranslateY.value = 0;
        } else {
          // Reset to initial state for animation
          entranceOpacity.value = 0;
          entranceTranslateY.value = 50;

          // Stagger relative to first visible card
          const relativeIndex = index - firstVisibleIndex;
          const delay = relativeIndex * STAGGER_DELAY;
          entranceOpacity.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING));
          entranceTranslateY.value = withDelay(delay, withSpring(0, ENTRANCE_SPRING));
        }
      }
    }
  );

  // Initial animation on mount - always stagger from top
  useEffect(() => {
    if (isInitialMount) {
      const delay = index * STAGGER_DELAY;
      entranceOpacity.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING));
      entranceTranslateY.value = withDelay(delay, withSpring(0, ENTRANCE_SPRING));
    } else {
      // Not initial mount, show instantly
      entranceOpacity.value = 1;
      entranceTranslateY.value = 0;
    }
  }, []);

  // Entrance animation style
  const entranceAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: entranceOpacity.value,
      transform: [{ translateY: entranceTranslateY.value }],
    };
  });

  // Scroll-based scale animation (separate from entrance animation)
  const scrollAnimatedStyle = useAnimatedStyle(() => {
    const cardStart = index * cardHeight;
    const cardEnd = (index + 1) * cardHeight;

    // Calculate how far the card is from being fully in view
    const inputRange = [
      cardStart - cardHeight,  // Card is one full card below viewport
      cardStart,               // Card is at the top of viewport
      cardEnd,                 // Card is scrolled past
    ];

    // Scale: starts at 0.75, scales up to 1.0 when in view, scales down when scrolled past
    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.75, 1, 0.92],
      Extrapolation.CLAMP
    );

    // Opacity: fades in as card approaches
    const scrollOpacity = interpolate(
      scrollY.value,
      inputRange,
      [0.4, 1, 0.7],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity: scrollOpacity,
    };
  });

  return (
    // Outer: handles stagger entrance animation (translateY + fade)
    <Animated.View
      style={[styles.cardWrapper, { height: cardHeight }, entranceAnimatedStyle]}
    >
      {/* Inner: handles scroll-based scale animation */}
      <Animated.View style={[styles.cardInner, scrollAnimatedStyle]}>
        <EventCard event={event} onPress={onPress} />
      </Animated.View>
    </Animated.View>
  );
};

// Helper function to determine if an event is happening now
// Matches the logic in EventCard.tsx for consistency
const isHappeningNow = (event: Event): boolean => {
  const now = Date.now();
  const eventTime = new Date(event.dateTime).getTime();
  const timeDiff = now - eventTime;
  const durationMs = event.displayDuration * 60 * 1000; // Convert minutes to ms
  // Event started and within displayDuration OR starts within next 5 minutes
  return (timeDiff >= 0 && timeDiff <= durationMs) || (timeDiff < 0 && timeDiff >= -5 * 60 * 1000);
};

export const FeedScreen: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [showHappeningNow, setShowHappeningNow] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<EventFilterState>(DEFAULT_FILTER_STATE);
  const insets = useSafeAreaInsets();

  // Count active filters for badge
  const activeFilterCount = countActiveFilters(filters);

  // Mark initial mount as complete after first render
  useEffect(() => {
    // Small delay to ensure initial animations have started
    const timer = setTimeout(() => setIsInitialMount(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate card height based on available space
  const cardHeight = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT - insets.top;

  // Scroll position for animations
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fetch events from API
  const { events: apiEvents, isLoading, error, refresh } = useEvents();

  // Track if initial load has completed
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Animation trigger to re-trigger stagger animation on tab focus
  // Using shared value instead of React state to avoid re-render delay
  const animationTrigger = useSharedValue(0);

  // Mark as loaded once we finish loading for the first time
  useEffect(() => {
    if (!isLoading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [isLoading, hasLoadedOnce]);

  
  // Debug logging
  useEffect(() => {
    console.log('[FeedScreen] API state:', {
      isLoading,
      error: error?.message,
      eventCount: apiEvents.length,
      hasLoadedOnce,
    });
  }, [isLoading, error, apiEvents.length, hasLoadedOnce]);

  // Map API events to frontend format
  // Only fallback to mock data if there's an error, not just empty data
  const events: Event[] = error
    ? mockEvents
    : apiEvents.length > 0
      ? mapApiEventsToEvents(apiEvents)
      : hasLoadedOnce
        ? [] // API returned no events
        : mockEvents; // Still loading, show mock as placeholder

  // Filter events based on "Happening Now" toggle
  const filteredEvents = showHappeningNow
    ? events.filter(isHappeningNow)
    : events;

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Get navigation and route for tab press detection and params
  const navigation = useNavigation();
  const route = useRoute();

  // Refresh when navigating here after creating a new event
  useEffect(() => {
    const params = route.params as { refresh?: boolean } | undefined;
    if (params?.refresh) {
      refresh();
      // Clear the param so it doesn't refresh again on subsequent focuses
      navigation.setParams({ refresh: undefined } as any);
    }
  }, [route.params, refresh, navigation]);

  // Refresh when user taps the Feed tab while already on it
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        handleRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, handleRefresh]);

  // Play stagger animation when switching to this tab
  // Also refresh events to catch any missed socket updates
  useFocusEffect(
    useCallback(() => {
      // Trigger stagger animation by incrementing shared value
      // Direct mutation - no React state, no re-render, no delay
      animationTrigger.value = animationTrigger.value + 1;

      // Refresh events to ensure we have latest isFull status
      // This catches any missed socket updates
      refresh();
    }, [refresh])
  );

  return (
    <ImageBackground
      source={require('../assets/images/feed-background.png')}
      style={styles.wrapper}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" />

        {/* Header Row 1: Title and Icons */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>The Feed</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Text style={styles.headerIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header Row 2: Filter Controls */}
        <View style={styles.filterRow}>
          {/* NOW Button */}
          <TouchableOpacity
            style={[
              styles.happeningNowToggle,
              showHappeningNow && styles.happeningNowToggleActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowHappeningNow(!showHappeningNow);
            }}
            activeOpacity={0.85}
          >
            {showHappeningNow ? (
              <LinearGradient
                colors={['#c084fc', '#e9d5ff', '#f5f3ff', '#ddd6fe', '#c084fc']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.happeningNowGradient}
              >
                <Text style={styles.happeningNowTextActive}>NOW</Text>
              </LinearGradient>
            ) : (
              <View style={styles.happeningNowGradient}>
                <Text style={styles.happeningNowText}>NOW</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilterCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFilterModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color="#fff"
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Events Feed with snap scroll */}
        <View style={styles.feedContainer}>

          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          ) : events.length === 0 && hasLoadedOnce ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🌊</Text>
              <Text style={styles.emptyStateTitle}>No Events Yet</Text>
              <Text style={styles.emptyStateText}>
                Be the first to create an event for this cruise!
              </Text>
            </View>
          ) : filteredEvents.length === 0 && showHappeningNow ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>⏰</Text>
              <Text style={styles.emptyStateTitle}>Nothing Happening Now</Text>
              <Text style={styles.emptyStateText}>
                Check back later or browse all upcoming events
              </Text>
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setShowHappeningNow(false)}
              >
                <Text style={styles.showAllButtonText}>Show All Events</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.ScrollView
              style={styles.feed}
              contentContainerStyle={styles.feedContent}
              showsVerticalScrollIndicator={false}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              snapToInterval={cardHeight}
              snapToAlignment="start"
              decelerationRate="fast"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#667eea"
                  colors={['#667eea']}
                />
              }
            >
              {filteredEvents.map((event, index) => (
                <AnimatedEventCard
                  key={event.id}
                  event={event}
                  index={index}
                  scrollY={scrollY}
                  cardHeight={cardHeight}
                  onPress={() => handleEventPress(event)}
                  trigger={animationTrigger}
                  isInitialMount={isInitialMount}
                />
              ))}

              {/* Bottom padding for last card */}
              <View style={{ height: TAB_BAR_HEIGHT }} />
            </Animated.ScrollView>
          )}
        </View>

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          visible={modalVisible}
          onClose={handleCloseModal}
        />

        {/* Event Filter Modal */}
        <EventFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            // Update happeningNow state from filters
            setShowHappeningNow(newFilters.happeningNow);
          }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    fontSize: 20,
    opacity: 0.8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  happeningNowToggle: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(30, 30, 35, 0.9)',
  },
  happeningNowToggleActive: {
    borderColor: '#fff',
    backgroundColor: 'transparent',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  happeningNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  happeningNowText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  happeningNowTextActive: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  feedContainer: {
    flex: 1,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    // No padding needed - cards handle their own layout
  },
  cardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInner: {
    flex: 1,
    width: '100%',
  },
  emptyFeedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  showAllButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 24,
  },
  showAllButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderWidth: 2,
    borderColor: '#a78bfa',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  filterButtonActive: {
    borderColor: '#c084fc',
    shadowColor: '#c084fc',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f472b6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
