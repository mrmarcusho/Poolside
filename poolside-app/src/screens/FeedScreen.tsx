import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { EventCard, GradientBackground } from '../components';
import { mockEvents } from '../data/mockEvents';

export const FeedScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = React.useState<'upcoming' | 'saved'>('upcoming');

  return (
    <GradientBackground>
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

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'upcoming' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('upcoming')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'upcoming' && styles.filterTabTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'saved' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('saved')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'saved' && styles.filterTabTextActive,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Events Feed with scroll fade */}
        <View style={styles.feedContainer}>
          {/* Scroll fade overlay - content blends into this */}
          <LinearGradient
            colors={[
              'rgba(24, 24, 27, 1)',
              'rgba(24, 24, 27, 0.8)',
              'rgba(24, 24, 27, 0)',
            ]}
            locations={[0, 0.4, 1]}
            style={styles.scrollFadeOverlay}
            pointerEvents="none"
          />

          <ScrollView
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
          >
            {mockEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => console.log('Event pressed:', event.id)}
              />
            ))}

            {/* Bottom padding for tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 2,
  },
  logoContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: -40,
  },
  logo: {
    height: 70,
    width: 216,
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
  pageTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#ffffff',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
  },
  filterTabText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  filterTabTextActive: {
    color: '#0a0a0f',
  },
  feedContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollFadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingTop: 4,
  },
});
