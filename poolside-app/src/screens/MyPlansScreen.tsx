import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileBackground } from '../components';
import { useRsvp } from '../context/RsvpContext';
import { mockEvents } from '../data/mockEvents';
import { CompactEventCard } from '../components';
import { mapApiEventsToEvents } from '../utils';
import { Event } from '../types';

const { width } = Dimensions.get('window');

type TabType = 'going' | 'interested';

export const MyPlansScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('going');
  const [refreshing, setRefreshing] = useState(false);
  const { getEventsByStatus, isLoading, refresh, rsvpData } = useRsvp();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get events from API (returns ApiEvent[])
  const goingApiEvents = getEventsByStatus('going');
  const interestedApiEvents = getEventsByStatus('interested');

  // Convert to frontend Event format, fallback to mock data if no API data
  const goingEvents: Event[] = goingApiEvents.length > 0
    ? mapApiEventsToEvents(goingApiEvents)
    : mockEvents.filter(e => false); // Empty when no RSVPs

  const interestedEvents: Event[] = interestedApiEvents.length > 0
    ? mapApiEventsToEvents(interestedApiEvents)
    : mockEvents.filter(e => false); // Empty when no RSVPs

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'going' ? 0 : 1,
      stiffness: 300,
      damping: 25,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const currentEvents = activeTab === 'going' ? goingEvents : interestedEvents;

  return (
    <View style={styles.wrapper}>
      <ProfileBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/myplans-icon.png')}
          style={styles.titleImage}
          resizeMode="contain"
        />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (width - 48) / 2],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('going')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'going' && styles.tabTextActive]}>
              Going ({goingEvents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('interested')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'interested' && styles.tabTextActive]}>
              Interested ({interestedEvents.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : currentEvents.length === 0 ? (
        <View style={styles.emptyContent}>
          <Text style={styles.emoji}>{activeTab === 'going' ? '📅' : '⭐'}</Text>
          <Text style={styles.placeholder}>
            {activeTab === 'going'
              ? "Events you're going to will appear here"
              : "Events you're interested in will appear here"}
          </Text>
          <Text style={styles.subPlaceholder}>
            Tap RSVP on any event to get started
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          {currentEvents.map(event => (
            <CompactEventCard key={event.id} event={event} />
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleImage: {
    width: 280,
    height: 80,
    marginVertical: -15,
    marginLeft: -70,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (width - 48) / 2 - 4,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  subPlaceholder: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
