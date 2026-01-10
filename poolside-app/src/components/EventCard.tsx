import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Event } from '../types';
import { useRsvp } from '../context/RsvpContext';
import { useAuth } from '../context/AuthContext';
import { MainStackParamList } from '../navigation/MainNavigator';

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

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { getRsvpStatus, setRsvp } = useRsvp();
  const { user: currentUser } = useAuth();

  // Check if current user is the host of this event
  const isOwnEvent = event.hosts.some(host => host.id === currentUser?.id);
  const [isSplit, setIsSplit] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<number[]>([]);
  const confettiIdRef = useRef(0);
  const contextRsvpStatus = getRsvpStatus(event.id);

  // Local state for immediate UI feedback (avoids flash from async context update)
  const [localRsvpStatus, setLocalRsvpStatus] = useState<'going' | 'interested' | null>(contextRsvpStatus);

  // Use local state for rendering - it updates immediately
  const rsvpStatus = localRsvpStatus;

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

  const handleSelectGoing = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Update local state FIRST for immediate UI feedback
    setLocalRsvpStatus('going');

    // Hide split buttons immediately
    splitButtonsAnim.setValue(0);

    // Set context RSVP status
    setRsvp(event.id, 'going');
    setIsSplit(false);
    setShowCancelButton(false);

    // Trigger confetti!
    triggerConfetti();

    // Show button after React has processed state update
    setTimeout(() => {
      rsvpButtonAnim.setValue(1);
    }, 0);
  };

  const handleSelectInterested = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Update local state FIRST for immediate UI feedback
    setLocalRsvpStatus('interested');

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

    // Clear the selection
    setLocalRsvpStatus(null);
    setRsvp(event.id, null);

    // Hide split buttons immediately
    splitButtonsAnim.setValue(0);
    setIsSplit(false);
    setShowCancelButton(false);

    // Show RSVP button after state update
    setTimeout(() => {
      rsvpButtonAnim.setValue(1);
    }, 0);
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

      {/* Frosted glass card that blurs the background */}
      <BlurView intensity={40} tint="dark" style={styles.card}>
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
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreButtonText}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* Event Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.eventImage }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        </View>

        {/* Event Details */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>{formatDateTime(event.dateTime)}</Text>
              </View>
              {!isOwnEvent && (
                <TouchableOpacity
                  style={styles.eventChatButton}
                  onPress={handleEventChat}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eventChatButtonText}>Event Chat</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{event.locationName} - {event.locationDeck.split(',')[0]}</Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        </View>

        {/* Footer with Attendees and RSVP */}
        <View style={styles.footer}>
          {event.rsvpCount > 0 ? (
            <View style={styles.attendeesContainer}>
              <View style={styles.attendeeAvatars}>
                {event.attendees.slice(0, 5).map((attendee, index) => (
                  <View
                    key={attendee.id}
                    style={[
                      styles.attendeeAvatar,
                      { marginLeft: index === 0 ? 0 : -10, zIndex: 5 - index },
                    ]}
                  >
                    {attendee.avatar ? (
                      <Image
                        source={{ uri: attendee.avatar }}
                        style={styles.attendeeAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.attendeeEmoji}>{attendee.emoji || '👤'}</Text>
                    )}
                  </View>
                ))}
              </View>
              <Text style={styles.attendeeCount}>+{event.rsvpCount} going</Text>
            </View>
          ) : (
            <View style={styles.attendeesContainer} />
          )}

          {/* Only show RSVP buttons if this is not the user's own event */}
          {!isOwnEvent && (
            <View style={styles.rsvpContainer}>
              {/* RSVP Button / Selected State Button */}
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
                <TouchableOpacity onPress={handleRsvpPress} activeOpacity={0.8}>
                  {rsvpStatus === null ? (
                    <LinearGradient
                      colors={['#3b82f6', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rsvpGradient}
                    >
                      <Text style={styles.rsvpButtonText}>RSVP</Text>
                    </LinearGradient>
                  ) : rsvpStatus === 'going' ? (
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rsvpGradient}
                    >
                      <Text style={styles.rsvpButtonText}>✓ Going</Text>
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={['#f59e0b', '#d97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rsvpGradient}
                    >
                      <Text style={styles.rsvpButtonText}>★ Interested</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
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
                <TouchableOpacity onPress={handleSelectGoing} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.splitButton}
                  >
                    <Text style={styles.splitButtonText}>Going</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSelectInterested} activeOpacity={0.8} style={styles.interestedButton}>
                  <Text style={styles.interestedButtonText}>Interested</Text>
                </TouchableOpacity>
                {showCancelButton && (
                  <TouchableOpacity onPress={handleClearSelection} activeOpacity={0.8} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          )}
        </View>
      </BlurView>
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaContainer: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventChatButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
  },
  eventChatButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#fff',
  },
  metaIcon: {
    fontSize: 15,
  },
  metaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  description: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.65)',
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
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatars: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(30, 30, 45, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  attendeeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  attendeeEmoji: {
    fontSize: 12,
  },
  attendeeCount: {
    fontFamily: 'Satoshi-Medium',
    marginLeft: 8,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rsvpContainer: {
    position: 'relative',
    height: 36,
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
});
