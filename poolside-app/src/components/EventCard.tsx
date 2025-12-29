import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Event, RSVPStatus } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('none');

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

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  const handleGoingPress = () => {
    setRsvpStatus(rsvpStatus === 'going' ? 'none' : 'going');
  };

  const handleInterestedPress = () => {
    setRsvpStatus(rsvpStatus === 'maybe' ? 'none' : 'maybe');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          <View style={styles.photoWrapper}>
            <Image source={{ uri: event.locationImage }} style={styles.photo} />
          </View>
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: event.hosts[0]?.avatar || event.locationImage }}
              style={styles.photo}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.dateTime}>{formatDateTime(event.dateTime)}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{event.locationName}</Text>
          </View>

          {/* RSVP Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.rsvpButton,
                rsvpStatus === 'going' && styles.rsvpButtonActive,
              ]}
              onPress={handleGoingPress}
            >
              <Text
                style={[
                  styles.rsvpButtonText,
                  rsvpStatus === 'going' && styles.rsvpButtonTextActive,
                ]}
              >
                ✓ Going
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.interestedButton,
                rsvpStatus === 'maybe' && styles.interestedButtonActive,
              ]}
              onPress={handleInterestedPress}
            >
              <Text
                style={[
                  styles.interestedButtonText,
                  rsvpStatus === 'maybe' && styles.interestedButtonTextActive,
                ]}
              >
                ☆ Interested
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 2,
    padding: 12,
    paddingBottom: 0,
  },
  photoWrapper: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 14,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  dateTime: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 12,
  },
  location: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rsvpButtonActive: {
    backgroundColor: '#2ecc71',
  },
  rsvpButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#0a0a0f',
  },
  rsvpButtonTextActive: {
    color: '#fff',
  },
  interestedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  interestedButtonActive: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  interestedButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  interestedButtonTextActive: {
    color: '#fff',
  },
});
