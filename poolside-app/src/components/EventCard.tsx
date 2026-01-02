import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';
import { useRsvp } from '../context/RsvpContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { getRsvpStatus, setRsvp } = useRsvp();
  const [isSplit, setIsSplit] = useState(false);
  const rsvpStatus = getRsvpStatus(event.id);

  // Animation values
  const rsvpButtonAnim = useRef(new Animated.Value(1)).current;
  const splitButtonsAnim = useRef(new Animated.Value(0)).current;

  const handleRsvpPress = () => {
    if (rsvpStatus !== null) {
      // If already selected, reset to show RSVP button
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRsvp(event.id, null);
      setIsSplit(false);
      Animated.parallel([
        Animated.spring(rsvpButtonAnim, {
          toValue: 1,
          stiffness: 300,
          damping: 18,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(splitButtonsAnim, {
          toValue: 0,
          stiffness: 300,
          damping: 18,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSplit(true);

    // Animate RSVP button out, split buttons in
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
    setRsvp(event.id, 'going');
    setIsSplit(false);

    // Animate back
    Animated.parallel([
      Animated.spring(rsvpButtonAnim, {
        toValue: 1,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(splitButtonsAnim, {
        toValue: 0,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectInterested = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRsvp(event.id, 'interested');
    setIsSplit(false);

    // Animate back
    Animated.parallel([
      Animated.spring(rsvpButtonAnim, {
        toValue: 1,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(splitButtonsAnim, {
        toValue: 0,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.cardContainer}
    >
      {/* Frosted glass card that blurs the background */}
      <BlurView intensity={40} tint="dark" style={styles.card}>
        {/* Host Header */}
        <View style={styles.hostHeader}>
          <View style={styles.hostAvatar}>
            <Text style={styles.hostAvatarEmoji}>{host?.emoji || '👤'}</Text>
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{host?.name || 'Anonymous'}</Text>
            <Text style={styles.hostLabel}>Host</Text>
          </View>
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
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDateTime(event.dateTime)}</Text>
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
          <View style={styles.attendeesContainer}>
            <View style={styles.attendeeAvatars}>
              {event.attendees.slice(0, 3).map((attendee, index) => (
                <View
                  key={attendee.id}
                  style={[
                    styles.attendeeAvatar,
                    { marginLeft: index === 0 ? 0 : -10, zIndex: 3 - index },
                  ]}
                >
                  <Text style={styles.attendeeEmoji}>{attendee.emoji || '👤'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.attendeeCount}>+{event.rsvpCount} going</Text>
          </View>

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
            </Animated.View>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
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
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarEmoji: {
    fontSize: 18,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 10,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  hostLabel: {
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
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  // Content
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  metaContainer: {
    gap: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
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
  },
  attendeeEmoji: {
    fontSize: 12,
  },
  attendeeCount: {
    marginLeft: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
