import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { EventCard, EventDetailModal, ProfileBackground } from '../components';
import { mockEvents } from '../data/mockEvents';
import { Event } from '../types';
import { useEvents } from '../hooks';
import { mapApiEventsToEvents } from '../utils';

export const FeedScreen: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events from API
  const { events: apiEvents, isLoading, error, refresh } = useEvents();

  // Track if initial load has completed
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

  // Get navigation for tab press detection
  const navigation = useNavigation();

  // Refresh when user taps the Feed tab while already on it
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        handleRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, handleRefresh]);

  // Refresh when screen comes into focus (e.g., after creating an event)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={styles.wrapper}>
      <ProfileBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" />

        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/poolside-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Text style={styles.headerIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Cruise Feed</Text>
        </View>

        {/* Refresh Spinner */}
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color="#667eea" />
          </View>
        )}

        {/* Events Feed with scroll fade */}
        <View style={styles.feedContainer}>
          
          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          ) : (
            <ScrollView
              style={styles.feed}
              contentContainerStyle={[
                styles.feedContent,
                events.length === 0 && styles.emptyFeedContent,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#667eea"
                  colors={['#667eea']}
                />
              }
            >
              {events.length === 0 && hasLoadedOnce ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>🌊</Text>
                  <Text style={styles.emptyStateTitle}>No Events Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Be the first to create an event for this cruise!
                  </Text>
                </View>
              ) : (
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => handleEventPress(event)}
                  />
                ))
              )}

              {/* Bottom padding for tab bar */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </View>

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          visible={modalVisible}
          onClose={handleCloseModal}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 1,
  },
  logoContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: -40,
  },
  logo: {
    height: 70,
    width: 210,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    marginTop: -10,
  },
  refreshIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pageTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#ffffff',
  },
  feedContainer: {
    flex: 1,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingTop: 4,
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
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
