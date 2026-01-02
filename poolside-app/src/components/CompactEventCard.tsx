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
const CARD_PADDING = 12;
const THUMBNAIL_SIZE = 60;
const EXPANDED_IMAGE_HEIGHT = 180;

interface CompactEventCardProps {
  event: Event;
}

export const CompactEventCard: React.FC<CompactEventCardProps> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getRsvpStatus, setRsvp } = useRsvp();
  const rsvpStatus = getRsvpStatus(event.id);

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(expandAnim, {
      toValue,
      stiffness: 200,
      damping: 20,
      mass: 1,
      useNativeDriver: false, // Need false for width/height animations
    }).start();
  };

  const handleRemoveRsvp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRsvp(event.id, null);
  };

  const host = event.hosts[0];

  // Interpolated values
  const imageWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMBNAIL_SIZE, CARD_WIDTH - (CARD_PADDING * 2)],
  });

  const imageHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMBNAIL_SIZE, EXPANDED_IMAGE_HEIGHT],
  });

  const imageBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 12],
  });

  const titleFontSize = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 18],
  });

  const infoMarginLeft = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMBNAIL_SIZE + 20, 0],
  });

  const infoMarginTop = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const infoPosition = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const badgeTop = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 20],
  });

  const badgeRight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 20],
  });

  const badgeSize = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 36],
  });

  const expandedContentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const expandedContentHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const arrowRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      <BlurView intensity={40} tint="dark" style={styles.card}>
        <View style={styles.cardInner}>
          {/* Image */}
          <Animated.View
            style={[
              styles.imageContainer,
              {
                width: imageWidth,
                height: imageHeight,
                borderRadius: imageBorderRadius,
              },
            ]}
          >
            <Image
              source={{ uri: event.eventImage }}
              style={styles.image}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Info Section - positioned absolutely when collapsed */}
          <Animated.View
            style={[
              styles.infoContainer,
              {
                marginLeft: infoMarginLeft,
                marginTop: infoMarginTop,
                position: isExpanded ? 'relative' : 'absolute',
                top: isExpanded ? undefined : 12,
                left: isExpanded ? undefined : 0,
                right: isExpanded ? undefined : 56,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.title,
                { fontSize: titleFontSize },
              ]}
              numberOfLines={isExpanded ? undefined : 1}
            >
              {event.title}
            </Animated.Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {formatDateTime(event.dateTime)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {event.locationName}{isExpanded ? ` - ${event.locationDeck.split(',')[0]}` : ''}
              </Text>
            </View>
          </Animated.View>

          {/* Status Badge */}
          <Animated.View
            style={[
              styles.statusBadge,
              {
                top: badgeTop,
                right: badgeRight,
                width: badgeSize,
                height: badgeSize,
                borderRadius: Animated.divide(badgeSize, 2),
              },
            ]}
          >
            {rsvpStatus === 'going' ? (
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeText}>✓</Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeText}>★</Text>
              </LinearGradient>
            )}
          </Animated.View>
        </View>

        {/* Expanded Content */}
        <Animated.View
          style={[
            styles.expandedContent,
            {
              opacity: expandedContentOpacity,
              maxHeight: expandedContentHeight,
            },
          ]}
        >
          {/* Host Info */}
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostEmoji}>{host?.emoji || '👤'}</Text>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{host?.name || 'Anonymous'}</Text>
              <Text style={styles.hostLabel}>Host</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{event.description}</Text>

          {/* Attendees */}
          <View style={styles.attendeesRow}>
            <View style={styles.attendeeAvatars}>
              {event.attendees.slice(0, 3).map((attendee, index) => (
                <View
                  key={attendee.id}
                  style={[
                    styles.attendeeAvatar,
                    { marginLeft: index === 0 ? 0 : -8, zIndex: 3 - index },
                  ]}
                >
                  <Text style={styles.attendeeEmoji}>{attendee.emoji || '👤'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.attendeeCount}>+{event.rsvpCount} going</Text>
          </View>

          {/* Remove RSVP Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveRsvp}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>Remove RSVP</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Expand Indicator */}
        <Animated.View
          style={[
            styles.expandIndicator,
            { transform: [{ rotate: arrowRotation }] },
          ]}
        >
          <Text style={styles.expandIcon}>▼</Text>
        </Animated.View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardInner: {
    padding: CARD_PADDING,
    minHeight: THUMBNAIL_SIZE + (CARD_PADDING * 2),
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    overflow: 'hidden',
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 14,
    color: '#ffffff',
  },
  expandedContent: {
    paddingHorizontal: CARD_PADDING,
    overflow: 'hidden',
    gap: 12,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostEmoji: {
    fontSize: 16,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  hostLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatars: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(30, 30, 45, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeEmoji: {
    fontSize: 10,
  },
  attendeeCount: {
    marginLeft: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expandIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandIcon: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
