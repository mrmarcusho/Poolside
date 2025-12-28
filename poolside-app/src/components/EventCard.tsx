import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Event, RSVPStatus } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('none');
  const [showRsvpOptions, setShowRsvpOptions] = useState(false);

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

  const handleRsvpPress = () => {
    if (rsvpStatus === 'none') {
      setRsvpStatus('going');
      setShowRsvpOptions(true);
    } else {
      setShowRsvpOptions(!showRsvpOptions);
    }
  };

  const handleRsvpSelect = (status: RSVPStatus) => {
    setRsvpStatus(status);
    setShowRsvpOptions(false);
  };

  const getRsvpButtonStyle = () => {
    switch (rsvpStatus) {
      case 'going':
        return styles.rsvpButtonGoing;
      case 'maybe':
        return styles.rsvpButtonMaybe;
      case 'cant':
        return styles.rsvpButtonCant;
      default:
        return {};
    }
  };

  const getRsvpButtonText = () => {
    switch (rsvpStatus) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'cant':
        return "Can't Go";
      default:
        return 'RSVP';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        {/* Background Image with Gradient Overlay */}
        <Image source={{ uri: event.locationImage }} style={styles.backgroundImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />

        {/* Theme Accent Bar */}
        <LinearGradient
          colors={event.theme.gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Location Badge */}
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              {event.locationDeck} - {event.locationName}
            </Text>
          </View>

          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.dateTime}>{formatDateTime(event.dateTime)}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Hosts */}
            <View style={styles.hostsContainer}>
              <View style={styles.avatarStack}>
                {event.hosts.slice(0, 3).map((host, index) => (
                  <Image
                    key={host.id}
                    source={{ uri: host.avatar }}
                    style={[
                      styles.hostAvatar,
                      { marginLeft: index > 0 ? -12 : 0, zIndex: 3 - index },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostedBy}>Hosted by</Text>
                <Text style={styles.hostNames}>
                  {event.hosts.map((h) => h.name).join(' & ')}
                </Text>
              </View>
            </View>

            {/* RSVP Section */}
            <View style={styles.rsvpSection}>
              <Text style={styles.rsvpCount}>{event.rsvpCount} going</Text>

              {showRsvpOptions ? (
                <View style={styles.rsvpOptions}>
                  <TouchableOpacity
                    style={[styles.rsvpOption, rsvpStatus === 'going' && styles.rsvpOptionActive]}
                    onPress={() => handleRsvpSelect('going')}
                  >
                    <Text style={styles.rsvpOptionText}>Going</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rsvpOption, rsvpStatus === 'maybe' && styles.rsvpOptionActive]}
                    onPress={() => handleRsvpSelect('maybe')}
                  >
                    <Text style={styles.rsvpOptionText}>Maybe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rsvpOption, rsvpStatus === 'cant' && styles.rsvpOptionActive]}
                    onPress={() => handleRsvpSelect('cant')}
                  >
                    <Text style={styles.rsvpOptionText}>Can't</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.rsvpButton, getRsvpButtonStyle()]}
                  onPress={handleRsvpPress}
                >
                  <Text style={styles.rsvpButtonText}>{getRsvpButtonText()}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  dateTime: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  hostsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostInfo: {
    marginLeft: 10,
  },
  hostedBy: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  hostNames: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  rsvpSection: {
    alignItems: 'flex-end',
  },
  rsvpCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 6,
  },
  rsvpButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  rsvpButtonGoing: {
    backgroundColor: '#2ecc71',
  },
  rsvpButtonMaybe: {
    backgroundColor: '#f39c12',
  },
  rsvpButtonCant: {
    backgroundColor: '#95a5a6',
  },
  rsvpButtonText: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: '700',
  },
  rsvpOptions: {
    flexDirection: 'row',
  },
  rsvpOption: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 6,
  },
  rsvpOptionActive: {
    backgroundColor: '#fff',
  },
  rsvpOptionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
