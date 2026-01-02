import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

/**
 * Mockup demonstrating the pull-to-refresh spinning wheel animation
 * This shows what users will see when they pull down on the Cruise Feed
 */
export const RefreshMockup: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Continuous spinning animation
  useEffect(() => {
    if (isRefreshing) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [isRefreshing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const toggleRefresh = () => setIsRefreshing(!isRefreshing);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cruise Feed</Text>
          <Text style={styles.subtitle}>Pull-to-Refresh Mockup</Text>
        </View>

        {/* Refresh Indicator Area */}
        <View style={styles.refreshArea}>
          <View style={styles.refreshContainer}>
            {/* Spinning Wheel */}
            <Animated.View
              style={[
                styles.spinnerOuter,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <View style={styles.spinnerInner}>
                {/* Spinner segments */}
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.spinnerSegment,
                      {
                        transform: [{ rotate: `${i * 45}deg` }],
                        opacity: 0.3 + (i * 0.1),
                      },
                    ]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Status Text */}
            <Text style={styles.refreshText}>
              {isRefreshing ? 'Refreshing...' : 'Pull down to refresh'}
            </Text>
          </View>
        </View>

        {/* Mock Event Cards */}
        <View style={styles.cardsContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.mockCard}>
              <View style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardTitle} />
                <View style={styles.cardSubtitle} />
              </View>
            </View>
          ))}
        </View>

        {/* Toggle Button */}
        <TouchableOpacity style={styles.toggleButton} onPress={toggleRefresh}>
          <Text style={styles.toggleButtonText}>
            {isRefreshing ? 'Stop Animation' : 'Start Animation'}
          </Text>
        </TouchableOpacity>

        {/* Alternative Spinner Styles */}
        <View style={styles.alternativesContainer}>
          <Text style={styles.alternativesTitle}>Alternative Spinner Styles:</Text>

          <View style={styles.alternativesRow}>
            {/* Style 1: Simple Circle */}
            <View style={styles.altSpinnerContainer}>
              <Animated.View
                style={[
                  styles.altSpinner1,
                  { transform: [{ rotate: spin }] },
                ]}
              />
              <Text style={styles.altLabel}>Circle</Text>
            </View>

            {/* Style 2: Dots */}
            <View style={styles.altSpinnerContainer}>
              <Animated.View
                style={[
                  styles.dotsContainer,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                {[...Array(3)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { opacity: 0.4 + (i * 0.3) },
                    ]}
                  />
                ))}
              </Animated.View>
              <Text style={styles.altLabel}>Dots</Text>
            </View>

            {/* Style 3: Wave */}
            <View style={styles.altSpinnerContainer}>
              <Animated.View
                style={[
                  styles.waveSpinner,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <View style={styles.waveInner} />
              </Animated.View>
              <Text style={styles.altLabel}>Wave</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  refreshArea: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  refreshContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerOuter: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  spinnerSegment: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: '#667eea',
    borderRadius: 2,
    left: 18,
    top: 0,
    transformOrigin: 'center 20px',
  },
  refreshText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  cardsContainer: {
    gap: 12,
  },
  mockCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  cardTitle: {
    height: 14,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  cardSubtitle: {
    height: 10,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
  },
  toggleButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativesContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  alternativesTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  alternativesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  altSpinnerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  altSpinner1: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderTopColor: '#667eea',
  },
  dotsContainer: {
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667eea',
  },
  waveSpinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#667eea',
  },
  altLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default RefreshMockup;
