import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';

const { width } = Dimensions.get('window');

export type EventTabType = 'going' | 'interested' | 'hosting';

interface ProfileEventCardProps {
  event: Event;
  status: EventTabType;
  onPress?: () => void;
}

export const ProfileEventCard: React.FC<ProfileEventCardProps> = ({
  event,
  status,
  onPress,
}) => {
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
    onPress?.();
  };

  const getBadgeConfig = () => {
    switch (status) {
      case 'going':
        return {
          colors: ['#22c55e', '#16a34a'] as const,
          icon: '✓',
        };
      case 'interested':
        return {
          colors: ['#f59e0b', '#d97706'] as const,
          icon: '★',
        };
      case 'hosting':
        return {
          colors: ['#8b5cf6', '#7c3aed'] as const,
          icon: '👑',
        };
    }
  };

  const badgeConfig = getBadgeConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      <BlurView intensity={40} tint="dark" style={styles.card}>
        {/* Top highlight line */}
        <View style={styles.topHighlight} />

        <View style={styles.cardContent}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: event.eventImage }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {/* Status Badge */}
            <View style={styles.badgeWrapper}>
              <LinearGradient
                colors={badgeConfig.colors}
                style={styles.badge}
              >
                <Text style={styles.badgeIcon}>{badgeConfig.icon}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.details}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {formatDateTime(event.dateTime)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.locationName}
                  {event.locationDeck ? ` - ${event.locationDeck.split(',')[0]}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeWrapper: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10, 10, 15, 0.9)',
  },
  badgeIcon: {
    fontSize: 11,
    color: '#ffffff',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  metaContainer: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 11,
    width: 16,
    textAlign: 'center',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    flex: 1,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '300',
  },
});
