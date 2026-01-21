import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Event } from '../types';
import { useRsvp } from '../context/RsvpContext';
import { useAuth } from '../context/AuthContext';
import { MainStackParamList } from '../navigation/MainNavigator';
import { eventsService, EventAttendee } from '../api/services/events';

// Pre-rendered blurred blob images
const blobImages = {
  purple: require('../assets/images/blobs/blob-purple.png'),
  pink: require('../assets/images/blobs/blob-pink.png'),
  green: require('../assets/images/blobs/blob-green.png'),
  amber: require('../assets/images/blobs/blob-amber.png'),
  red: require('../assets/images/blobs/blob-red.png'),
};

type BlobColor = 'purple' | 'pink' | 'green' | 'amber' | 'red';

interface GlowBlobProps {
  color: BlobColor;
  position: 'left' | 'right' | 'center';
}

const GlowBlob: React.FC<GlowBlobProps> = ({ color, position }) => {
  const positionStyles: Record<string, object> = {
    left: { left: -15, top: -35 },
    right: { right: -15, top: -35 },
    center: { left: 5, top: -35 },
  };

  return (
    <Image
      source={blobImages[color]}
      style={[
        {
          position: 'absolute',
          width: 100,
          height: 100,
          opacity: 0.8,
        },
        positionStyles[position],
      ]}
      pointerEvents="none"
    />
  );
};

// Confetti particle component
const CONFETTI_COLORS = ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f472b6', '#a78bfa', '#ffffff'];

interface ConfettiPieceProps {
  index: number;
  startX: number;
  startY: number;
  onComplete: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index, startX, startY, onComplete }) => {
  const angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
  const distance = 80 + Math.random() * 60;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance - 40; // Bias upward
  const rotation = Math.random() * 720 - 360;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 6 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    const delay = index * 20;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay + 400,
      withTiming(0, { duration: 200 }, () => {
        runOnJS(onComplete)();
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + endX * progress.value },
      { translateY: startY + endY * progress.value - 30 * progress.value },
      { rotate: `${rotation * progress.value}deg` },
      { scale: 1 - progress.value * 0.5 },
    ],
    opacity: opacity.value,
  }));

  return (
    <ReAnimated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Animated checkmark for waitlist button
interface AnimatedCheckmarkProps {
  progress: ReAnimated.SharedValue<number>;
}

const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({ progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [0.5, 1.1, 1]) }],
    };
  });

  return (
    <ReAnimated.View style={[{ width: 16, height: 16 }, animatedStyle]}>
      <Text style={{ fontSize: 14, color: 'white' }}>✓</Text>
    </ReAnimated.View>
  );
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  isPreview?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, isPreview = false }) => {
  // DEBUG: Log what description EventCard receives
  if (isPreview) {
    console.log('DEBUG EventCard (isPreview): event.description =', JSON.stringify(event.description));
  }
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { getRsvpStatus, setRsvp } = useRsvp();
  const { user: currentUser } = useAuth();

  // Check if current user is the host of this event
  const isOwnEvent = event.hosts.some(host => host.id === currentUser?.id);

  // Check if event is happening now (started and within displayDuration, or starting within next 5 minutes)
  const isHappeningNow = (() => {
    const now = Date.now();
    const eventTime = new Date(event.dateTime).getTime();
    const timeDiff = now - eventTime;
    const durationMs = event.displayDuration * 60 * 1000; // Convert minutes to ms
    // Event started and within displayDuration OR starts within next 5 minutes
    return (timeDiff >= 0 && timeDiff <= durationMs) || (timeDiff < 0 && timeDiff >= -5 * 60 * 1000);
  })();

  // Pulsing animation for live indicator
  const livePulse = useSharedValue(1);

  useEffect(() => {
    if (isHappeningNow) {
      livePulse.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isHappeningNow]);

  const liveDotStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
    transform: [{ scale: 0.8 + livePulse.value * 0.4 }],
  }));

  // Waving hand animation for "Join in!" when 0 attendees
  const waveRotation = useSharedValue(0);

  useEffect(() => {
    // Continuous wave animation
    waveRotation.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const waveAnimatedStyle = useAnimatedStyle(() => {
    // Wave pattern: 0 -> 20deg -> 0 -> -10deg -> 0
    const rotation = waveRotation.value < 0.5
      ? waveRotation.value * 40 // 0 to 20 degrees
      : 20 - (waveRotation.value - 0.5) * 60; // 20 to -10 degrees
    return {
      transform: [
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const [isSplit, setIsSplit] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<number[]>([]);
  const confettiIdRef = useRef(0);
  const contextRsvpStatus = getRsvpStatus(event.id);

  // Attendees modal state
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Preview attendees for the card (first 3)
  const [previewAttendees, setPreviewAttendees] = useState<EventAttendee[]>([]);

  // Waitlist button animation state
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const waitlistButtonScale = useRef(new Animated.Value(1)).current;
  const waitlistTextOpacity = useRef(new Animated.Value(1)).current;
  const waitlistAddedOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkProgress = useSharedValue(0);

  // Fetch preview attendees on mount
  useEffect(() => {
    const fetchPreviewAttendees = async () => {
      if (event.rsvpCount > 0) {
        try {
          const response = await eventsService.getEventAttendees(event.id);
          setPreviewAttendees(response.attendees.slice(0, 3));
        } catch (error) {
          console.error('Failed to fetch preview attendees:', error);
        }
      }
    };
    fetchPreviewAttendees();
  }, [event.id, event.rsvpCount]);

  // Local state for immediate UI feedback (avoids flash from async context update)
  const [localRsvpStatus, setLocalRsvpStatus] = useState<'going' | 'interested' | null>(contextRsvpStatus);
  const [localRsvpCount, setLocalRsvpCount] = useState(event.rsvpCount);
  const [localIsFull, setLocalIsFull] = useState(event.isFull ?? false);

  // Sync local state when event prop changes (e.g., server refresh or socket update)
  useEffect(() => {
    setLocalRsvpCount(event.rsvpCount);
  }, [event.rsvpCount]);

  useEffect(() => {
    setLocalIsFull(event.isFull ?? false);
  }, [event.isFull]);

  // Use local state for rendering - it updates immediately
  const rsvpStatus = localRsvpStatus;
  const rsvpCount = localRsvpCount;

  // Check if RSVP should be disabled (event is full and user hasn't RSVPed)
  // Users who already RSVPed can still change their selection
  const isRsvpDisabled = localIsFull && rsvpStatus === null;

  // Debug log to trace isFull changes
  useEffect(() => {
    console.log(`[EventCard] ${event.title}: localIsFull=${localIsFull}, rsvpStatus=${rsvpStatus}, isRsvpDisabled=${isRsvpDisabled}`);
  }, [localIsFull, rsvpStatus, event.title, isRsvpDisabled]);

  // Animation values
  const rsvpButtonAnim = useRef(new Animated.Value(1)).current;
  const splitButtonsAnim = useRef(new Animated.Value(0)).current;

  const triggerConfetti = useCallback(() => {
    const newPieces = Array.from({ length: 20 }, () => confettiIdRef.current++);
    setConfettiPieces(prev => [...prev, ...newPieces]);
  }, []);

  const removeConfettiPiece = useCallback((id: number) => {
    setConfettiPieces(prev => prev.filter(p => p !== id));
  }, []);

  const handleRsvpPress = () => {
    // Whether starting fresh or changing an existing selection, show split buttons
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSplit(true);

    // Show cancel button only if user already has a selection
    setShowCancelButton(rsvpStatus !== null);

    // Animate current button out, split buttons in
    Animated.parallel([
      Animated.spring(rsvpButtonAnim, {
        toValue: 0,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(splitButtonsAnim, {
        toValue: 1,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectGoing = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const previousStatus = localRsvpStatus;
    const previousCount = localRsvpCount;
    const previousAttendees = [...previewAttendees];

    // Update local state FIRST for immediate UI feedback
    setLocalRsvpStatus('going');

    // Update count: increment if user wasn't already going
    if (previousStatus !== 'going') {
      setLocalRsvpCount(prev => prev + 1);

      // Add current user to preview attendees (at the front)
      if (currentUser) {
        const userAsAttendee: EventAttendee = {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || null,
          emoji: currentUser.emoji || '👤',
          status: 'GOING',
        };
        // Filter out existing entry first to avoid duplicate keys
        setPreviewAttendees(prev => {
          const filtered = prev.filter(a => a.id !== currentUser.id);
          return [userAsAttendee, ...filtered].slice(0, 3);
        });
      }
    }

    // Hide split buttons and show main button IMMEDIATELY (don't wait for API)
    splitButtonsAnim.setValue(0);
    setIsSplit(false);
    setShowCancelButton(false);

    // Show the main RSVP button immediately with new "Going" state
    setTimeout(() => {
      rsvpButtonAnim.setValue(1);
    }, 0);

    // Trigger confetti immediately (optimistic)
    triggerConfetti();

    // Make API call in background
    try {
      await setRsvp(event.id, 'going');
    } catch (error: unknown) {
      // Revert optimistic UI updates on error
      setLocalRsvpStatus(previousStatus);
      setLocalRsvpCount(previousCount);
      setPreviewAttendees(previousAttendees);

      // Check if it's an "Event is full" error
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError?.response?.status === 400 &&
          axiosError?.response?.data?.message?.toLowerCase().includes('full')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Event is Full',
          'Sorry, this event just reached capacity. Would you like to join the waitlist?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Join Waitlist', onPress: () => {
              // TODO: Implement waitlist join
              Alert.alert('Coming Soon', 'Waitlist feature is coming soon!');
            }},
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to RSVP. Please try again.');
      }
    }
  };

  const handleSelectInterested = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const previousStatus = localRsvpStatus;

    // Update local state FIRST for immediate UI feedback
    setLocalRsvpStatus('interested');

    // Update count: decrement if user was previously going (interested doesn't count towards attendance)
    if (previousStatus === 'going') {
      setLocalRsvpCount(prev => Math.max(0, prev - 1));

      // Remove current user from preview attendees
      if (currentUser) {
        setPreviewAttendees(prev => prev.filter(a => a.id !== currentUser.id));
      }
    }

    // Hide split buttons immediately
    splitButtonsAnim.setValue(0);

    // Set context RSVP status
    setRsvp(event.id, 'interested');
    setIsSplit(false);
    setShowCancelButton(false);

    // Show button after React has processed state update
    setTimeout(() => {
      rsvpButtonAnim.setValue(1);
    }, 0);
  };

  const handleClearSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const previousStatus = localRsvpStatus;

    // Clear the selection
    setLocalRsvpStatus(null);
    setRsvp(event.id, null);

    // Update count: decrement if user was previously going
    if (previousStatus === 'going') {
      setLocalRsvpCount(prev => Math.max(0, prev - 1));

      // Remove current user from preview attendees
      if (currentUser) {
        setPreviewAttendees(prev => prev.filter(a => a.id !== currentUser.id));
      }

      // Optimistically set isFull to false since we're freeing up a spot
      // This prevents the flash of "Join Waitlist" before socket update arrives
      setLocalIsFull(false);
    }

    // Hide split buttons immediately
    splitButtonsAnim.setValue(0);
    setIsSplit(false);
    setShowCancelButton(false);

    // Show RSVP button after state update
    setTimeout(() => {
      rsvpButtonAnim.setValue(1);
    }, 0);
  };

  const handleWaitlistToggle = () => {
    if (isOnWaitlist) {
      // Leave waitlist
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate button press
      Animated.sequence([
        Animated.timing(waitlistButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(waitlistButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate text transition (reverse)
      Animated.parallel([
        Animated.timing(waitlistAddedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(waitlistTextOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset checkmark
      checkmarkProgress.value = withTiming(0, { duration: 200 });

      setIsOnWaitlist(false);
      // TODO: Call actual leave waitlist API when backend is ready
    } else {
      // Join waitlist
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate button press
      Animated.sequence([
        Animated.timing(waitlistButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(waitlistButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate text transition
      Animated.parallel([
        Animated.timing(waitlistTextOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(waitlistAddedOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark
      checkmarkProgress.value = withDelay(150, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));

      setIsOnWaitlist(true);
      // TODO: Call actual join waitlist API when backend is ready
    }
  };

  const formatDateTime = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const host = event.hosts[0];

  const handleHostPress = () => {
    if (host?.id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('ViewProfile', { userId: host.id });
    }
  };

  const handleEventChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Chat', {
      conversation: {
        id: event.id,
        name: event.title,
        emoji: '📅',
        isOnline: false,
        isEventChat: true,
        eventImage: event.eventImage,
      },
    });
  };

  const handleViewAttendees = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttendeesModal(true);
    setLoadingAttendees(true);
    try {
      const response = await eventsService.getEventAttendees(event.id);
      setAttendees(response.attendees);
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleAttendeePress = (userId: string) => {
    setShowAttendeesModal(false);
    navigation.navigate('ViewProfile', { userId });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.cardContainer}
    >
      {/* Confetti container - positioned at Going button */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiPieces.map((id, index) => (
          <ConfettiPiece
            key={id}
            index={index % 20}
            startX={50}
            startY={25}
            onComplete={() => removeConfettiPiece(id)}
          />
        ))}
      </View>

      {/* Frosted glass card */}
      <BlurView intensity={20} tint="dark" style={styles.card}>
        {/* Host Header */}
        <View style={styles.hostHeader}>
          <TouchableOpacity onPress={handleHostPress} style={styles.hostTouchable} activeOpacity={0.7}>
            <View style={styles.hostAvatar}>
              {host?.avatar ? (
                <Image
                  source={{ uri: host.avatar }}
                  style={styles.hostAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.hostAvatarEmoji}>{host?.emoji || '👤'}</Text>
              )}
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{host?.name || 'Anonymous'}</Text>
              <Text style={styles.hostLabel}>Host</Text>
            </View>
          </TouchableOpacity>
          {isHappeningNow ? (
            <View style={styles.liveTag}>
              <View style={styles.liveDotContainer}>
                <ReAnimated.View style={[styles.liveDotPulse, liveDotStyle]} />
                <View style={styles.liveDotCore} />
              </View>
              <Text style={styles.liveTagText}>Happening now</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>•••</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Event Image */}
        <View style={[styles.imageContainer, !event.eventImage && { backgroundColor: event.theme?.backgroundColor || '#1a1a2e' }]}>
          {event.eventImage ? (
            <Image
              source={{ uri: event.eventImage }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderEmoji}>🎉</Text>
            </View>
          )}
        </View>

        {/* Event Details */}
        <View style={styles.content}>
          <View style={styles.contentRow}>
            {/* Left side: Title, Meta, Description */}
            <View style={styles.contentLeft}>
              <Text style={styles.title}>{event.title}</Text>

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📅</Text>
                  <Text style={styles.metaText}>{formatDateTime(event.dateTime)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📍</Text>
                  <Text style={styles.metaText}>
                    {event.locationName}{event.locationDeck?.trim() ? ` · ${event.locationDeck.split(',')[0]}` : ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={3}>
                {event.description}
              </Text>
            </View>

            {/* Right side: Event Chat Button */}
            <TouchableOpacity
              onPress={handleEventChat}
              activeOpacity={0.7}
              style={styles.headerChatButton}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer with Guest List, Event Chat, and RSVP - hidden in preview mode */}
        {!isPreview && (
        <View style={styles.footer}>
          {/* Show Attendance & Event Chat only when NOT in split mode */}
          {!isSplit && (
            <View style={styles.footerLeftButtons}>
              {/* Attendance: Avatars + Count - clickable to view guest list */}
              <TouchableOpacity
                onPress={handleViewAttendees}
                activeOpacity={0.7}
                style={styles.attendanceButton}
              >
                {rsvpCount === 0 ? (
                  /* Zero attendees - "Join in!" CTA */
                  <View style={styles.joinInContainer}>
                    <ReAnimated.Text style={[styles.joinInWave, waveAnimatedStyle]}>👋</ReAnimated.Text>
                    <MaskedView
                      maskElement={
                        <Text style={styles.joinInTextMask}>Join in!</Text>
                      }
                    >
                      <LinearGradient
                        colors={['#c084fc', '#f5f3ff', '#93c5fd']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                      >
                        <Text style={[styles.joinInTextMask, { opacity: 0 }]}>Join in!</Text>
                      </LinearGradient>
                    </MaskedView>
                  </View>
                ) : (
                  <>
                    {previewAttendees.length > 0 && (
                      <View style={styles.avatarsRow}>
                        {previewAttendees.slice(0, 3).map((attendee, index) => (
                          <View
                            key={attendee.id}
                            style={[
                              styles.avatarCircle,
                              { marginLeft: index === 0 ? 0 : -8, zIndex: 3 - index },
                            ]}
                          >
                            {attendee.avatar ? (
                              <Image source={{ uri: attendee.avatar }} style={styles.avatarImage} />
                            ) : (
                              <Text style={styles.avatarEmoji}>{attendee.emoji || '👤'}</Text>
                            )}
                          </View>
                        ))}
                        {rsvpCount > 3 && (
                          <View style={[styles.avatarCircle, styles.avatarMore, { marginLeft: -8 }]}>
                            <Text style={styles.avatarMoreText}>+{rsvpCount - 3}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <Text style={styles.attendanceCount}>
                      {rsvpCount}
                      {event.spots && (
                        <Text style={styles.attendanceLimit}> / {event.spots}</Text>
                      )}
                      {!event.spots && rsvpCount > 0 && (
                        <Text style={styles.attendanceLimit}> going</Text>
                      )}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          )}

          {/* Spacer when in split mode to push buttons to the right */}
          {isSplit && <View style={styles.footerSpacer} />}

          {/* Only show RSVP buttons if this is not the user's own event */}
          {!isOwnEvent && (
            <View style={styles.rsvpContainer}>
              {/* RSVP Button / Selected State Button / Full Button */}
              <Animated.View
                style={[
                  styles.rsvpButtonWrapper,
                  {
                    opacity: rsvpButtonAnim,
                    transform: [
                      {
                        scale: rsvpButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents={isSplit ? 'none' : 'auto'}
              >
                {isRsvpDisabled ? (
                  /* Event is full and user hasn't RSVPed */
                  event.waitlistEnabled ? (
                    /* Waitlist enabled - show interactive button with animation */
                    <TouchableOpacity onPress={handleWaitlistToggle} activeOpacity={0.9}>
                      <Animated.View
                        style={[
                          styles.waitlistButton,
                          isOnWaitlist && styles.waitlistButtonAdded,
                          { transform: [{ scale: waitlistButtonScale }] },
                        ]}
                      >
                        {/* Join Waitlist text - fades out */}
                        <Animated.Text
                          style={[
                            styles.waitlistButtonText,
                            { opacity: waitlistTextOpacity, position: 'absolute' },
                          ]}
                        >
                          Join Waitlist
                        </Animated.Text>
                        {/* Added text with checkmark - fades in */}
                        <Animated.View
                          style={[
                            styles.waitlistAddedContent,
                            { opacity: waitlistAddedOpacity },
                          ]}
                        >
                          <AnimatedCheckmark progress={checkmarkProgress} />
                          <Text style={styles.waitlistAddedText}>Added</Text>
                        </Animated.View>
                      </Animated.View>
                    </TouchableOpacity>
                  ) : (
                    /* Waitlist disabled - show disabled FULL button */
                    <View style={styles.fullButton}>
                      <Text style={styles.fullButtonText}>FULL</Text>
                    </View>
                  )
                ) : (
                  <TouchableOpacity onPress={handleRsvpPress} activeOpacity={0.8} style={styles.glowButton}>
                    {/* Left blob - changes color based on status */}
                    <GlowBlob
                      color={
                        rsvpStatus === 'going' ? 'green' :
                        rsvpStatus === 'interested' ? 'amber' :
                        'purple'
                      }
                      position="left"
                    />
                    {/* Pink blob - right */}
                    <GlowBlob color="pink" position="right" />
                    {rsvpStatus === null ? (
                      <>
                        <Text style={styles.glowButtonIcon}>+</Text>
                        <Text style={styles.glowButtonText}>RSVP</Text>
                      </>
                    ) : rsvpStatus === 'going' ? (
                      <Text style={styles.glowButtonText}>✓ Going</Text>
                    ) : (
                      <Text style={styles.glowButtonText}>★ Interested</Text>
                    )}
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Split Buttons */}
              <Animated.View
                style={[
                  styles.splitButtonsContainer,
                  {
                    opacity: splitButtonsAnim,
                    transform: [
                      {
                        scale: splitButtonsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents={isSplit ? 'auto' : 'none'}
              >
                <TouchableOpacity onPress={handleSelectGoing} activeOpacity={0.8} style={styles.glowButtonSplit}>
                  {/* Green blob */}
                  <GlowBlob color="green" position="center" />
                  <Text style={styles.glowButtonText}>Going</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSelectInterested} activeOpacity={0.8} style={styles.glowButtonSplit}>
                  {/* Amber blob */}
                  <GlowBlob color="amber" position="center" />
                  <Text style={styles.glowButtonText}>Interested</Text>
                </TouchableOpacity>
                {showCancelButton && (
                  <TouchableOpacity onPress={handleClearSelection} activeOpacity={0.8} style={styles.cancelButtonGlow}>
                    {/* Red blob */}
                    <GlowBlob color="red" position="center" />
                    <Text style={styles.cancelButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          )}
        </View>
        )}
      </BlurView>

      {/* Attendees Modal */}
      <Modal
        visible={showAttendeesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttendeesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who's Going</Text>
              <TouchableOpacity
                onPress={() => setShowAttendeesModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingAttendees ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#2dd4bf" />
              </View>
            ) : attendees.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No one has RSVP'd yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.attendeesList}>
                {attendees.map((attendee) => (
                  <TouchableOpacity
                    key={attendee.id}
                    style={styles.attendeeItem}
                    onPress={() => handleAttendeePress(attendee.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.attendeeAvatar}>
                      {attendee.avatar ? (
                        <Image
                          source={{ uri: attendee.avatar }}
                          style={styles.attendeeAvatarImage}
                        />
                      ) : (
                        <Text style={styles.attendeeAvatarEmoji}>
                          {attendee.emoji || '👤'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{attendee.name}</Text>
                      <Text style={styles.attendeeStatus}>
                        {attendee.status === 'GOING' ? '✓ Going' : '★ Interested'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 100,
    height: 50,
    zIndex: 100,
    overflow: 'visible',
  },
  confettiPiece: {
    position: 'absolute',
  },
  card: {
    flex: 1,
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  // Host Header
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 10,
  },
  hostTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hostAvatarEmoji: {
    fontSize: 18,
  },
  hostAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 10,
  },
  hostName: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  hostLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 6,
  },
  liveDotContainer: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDotPulse: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveTagText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  // Event Image
  imageContainer: {
    width: '100%',
    flex: 1.2,
    minHeight: 180,
    maxHeight: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 48,
    opacity: 0.5,
  },
  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaContainer: {
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    fontSize: 15,
  },
  metaText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  // Content row layout (left: text, right: attendance)
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contentLeft: {
    flex: 1,
  },
  contentRight: {
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  // Attendance inline (Option 3 - Single Row)
  attendanceInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  avatarStackMini: {
    flexDirection: 'row',
  },
  avatarMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#1a1a2e',
    overflow: 'hidden',
  },
  avatarMiniImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  avatarMiniPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniEmoji: {
    fontSize: 8,
  },
  countContainer: {
    alignItems: 'center',
  },
  countInline: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#22c55e',
  },
  goingLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 10,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerLeftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  avatarMore: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  attendanceCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  attendanceLimit: {
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  headerChatButton: {
    padding: 2,
  },
  footerSpacer: {
    flex: 1,
  },
  gradientButtonWrapper: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  gradientButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  gradientButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  rsvpContainer: {
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  rsvpButtonWrapper: {
    position: 'absolute',
    right: 0,
  },
  rsvpGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rsvpButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  splitButtonsContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  splitButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  splitButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  interestedButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  interestedButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // New Glow Button Styles
  glowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(100, 180, 255, 0.6)',
    overflow: 'hidden',
    position: 'relative',
  },
  glowButtonSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    overflow: 'hidden',
    position: 'relative',
  },
  glowButtonIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  glowButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#fff',
  },
  // Blob styles for glow effect
  blob: {
    position: 'absolute',
    width: 50,
    height: 40,
    borderRadius: 25,
    top: 2,
  },
  blobLeft: {
    left: 5,
  },
  blobRight: {
    right: 5,
  },
  blobCenter: {
    alignSelf: 'center',
    left: 20,
  },
  blobPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.6)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  blobPink: {
    backgroundColor: 'rgba(236, 72, 153, 0.5)',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
  },
  blobGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.6)',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  blobAmber: {
    backgroundColor: 'rgba(251, 191, 36, 0.6)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  blobRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  cancelButtonGlow: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(75, 75, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
  waitlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  waitlistButtonAdded: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.35,
  },
  waitlistButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  waitlistAddedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitlistAddedText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  attendeesList: {
    padding: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  attendeeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  attendeeAvatarEmoji: {
    fontSize: 20,
  },
  attendeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attendeeName: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#ffffff',
  },
  attendeeStatus: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#22c55e',
    marginTop: 2,
  },
  // Zero attendees "Join in!" styles
  joinInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinInWave: {
    fontSize: 20,
  },
  joinInTextMask: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
});
