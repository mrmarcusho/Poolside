import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Event } from '../types';

const { width, height } = Dimensions.get('window');

interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  visible,
  onClose,
}) => {
  if (!event) return null;

  const host = event.hosts[0];

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (start: Date, end: Date) => {
    const startStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Large Event Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: event.eventImage }}
              style={styles.eventImage}
              resizeMode="cover"
            />
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                <Text style={styles.backButtonText}>←</Text>
              </BlurView>
            </TouchableOpacity>
            {/* Share Button */}
            <TouchableOpacity style={styles.shareButton}>
              <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                <Text style={styles.shareButtonText}>↗</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Host Section */}
            <View style={styles.hostSection}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarEmoji}>{host?.emoji || '👤'}</Text>
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{host?.name || 'Anonymous'}</Text>
                <Text style={styles.hostLabel}>Event Host</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>

            {/* Date & Time */}
            <View style={styles.metaSection}>
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <Text style={styles.metaIcon}>📅</Text>
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>DATE & TIME</Text>
                  <Text style={styles.metaValue}>{formatDate(event.dateTime)}</Text>
                  <Text style={styles.metaSub}>{formatTime(event.dateTime, event.endTime)}</Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <Text style={styles.metaIcon}>📍</Text>
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>LOCATION</Text>
                  <Text style={styles.metaValue}>{event.locationName}</Text>
                  <Text style={styles.metaSub}>{event.locationDeck}</Text>
                </View>
                <View style={styles.locationPreview}>
                  <Text style={styles.locationPreviewIcon}>🗺️</Text>
                </View>
              </View>
            </View>

            {/* Full Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>ABOUT THIS EVENT</Text>
              <Text style={styles.descriptionText}>{event.fullDescription}</Text>
            </View>

            {/* Attendees */}
            <View style={styles.attendeesSection}>
              <View style={styles.attendeesHeader}>
                <Text style={styles.sectionLabel}>GOING ({event.rsvpCount})</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.attendeeList}>
                {event.attendees.slice(0, 4).map((attendee) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    <View style={styles.attendeeLargeAvatar}>
                      <Text style={styles.attendeeLargeEmoji}>{attendee.emoji || '👤'}</Text>
                    </View>
                    <Text style={styles.attendeeName}>{attendee.name.split(' ')[0]}</Text>
                  </View>
                ))}
                {event.rsvpCount > 4 && (
                  <View style={styles.attendeeItem}>
                    <View style={[styles.attendeeLargeAvatar, styles.moreAvatar]}>
                      <Text style={styles.moreText}>+{event.rsvpCount - 4}</Text>
                    </View>
                    <Text style={styles.attendeeName}>more</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom padding for RSVP button */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Fixed RSVP Button */}
        <View style={styles.rsvpContainer}>
          <TouchableOpacity style={styles.rsvpButton}>
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rsvpGradient}
            >
              <Text style={styles.rsvpEmoji}>🎉</Text>
              <Text style={styles.rsvpButtonText}>I'm Going!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  // Image
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  shareButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  // Content
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
  },
  // Host Section
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarEmoji: {
    fontSize: 22,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  hostLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Meta Section
  metaSection: {
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 20,
  },
  metaTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  metaSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  locationPreview: {
    width: 60,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPreviewIcon: {
    fontSize: 20,
  },
  // Description
  descriptionSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Attendees
  attendeesSection: {
    marginBottom: 20,
  },
  attendeesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  attendeeList: {
    flexDirection: 'row',
    gap: 12,
  },
  attendeeItem: {
    alignItems: 'center',
    gap: 6,
  },
  attendeeLargeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeLargeEmoji: {
    fontSize: 24,
  },
  attendeeName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  moreAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // RSVP Button
  rsvpContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  rsvpButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  rsvpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  rsvpEmoji: {
    fontSize: 18,
  },
  rsvpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
});
