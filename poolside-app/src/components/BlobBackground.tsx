import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface BlobBackgroundProps {
  style?: object;
}

export const BlobBackground: React.FC<BlobBackgroundProps> = ({ style }) => {
  // Animation values - extremely slow, barely perceptible drift
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  useEffect(() => {
    // Very slow drift - 12-20 second cycles for imperceptible movement
    blob1X.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(50, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(60, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-40, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );

    blob2X.value = withRepeat(
      withSequence(
        withTiming(70, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-50, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(-55, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(45, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );

    blob3X.value = withRepeat(
      withSequence(
        withTiming(45, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-35, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withSequence(
        withTiming(-45, { duration: 13000, easing: Easing.inOut(Easing.sin) }),
        withTiming(55, { duration: 13000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob3X.value },
      { translateY: blob3Y.value },
    ],
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Deep purple-navy base */}
      <LinearGradient
        colors={['#0f0f1a', '#11101c', '#0d0d18']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/*
        Blob 1 - Muted purple (lower area)
        MASSIVE size + VERY low opacity + VERY gradual fade = imperceptible glow
      */}
      <Animated.View style={[styles.blob1, blob1Style]}>
        <LinearGradient
          colors={[
            'rgba(90, 60, 120, 0.12)',    // Muted purple center - VERY desaturated
            'rgba(80, 55, 105, 0.08)',    // Fading
            'rgba(70, 50, 95, 0.04)',     // More fading
            'rgba(60, 45, 85, 0.015)',    // Almost gone
            'transparent',
          ]}
          locations={[0, 0.15, 0.3, 0.45, 0.6]}  // Fade out by 60% of radius
          style={styles.gradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/*
        Blob 2 - Muted teal (upper right)
        Barely visible warmth shift
      */}
      <Animated.View style={[styles.blob2, blob2Style]}>
        <LinearGradient
          colors={[
            'rgba(40, 80, 90, 0.08)',     // Muted teal - very desaturated
            'rgba(35, 70, 80, 0.05)',     // Fading
            'rgba(30, 60, 70, 0.02)',     // More fading
            'transparent',
          ]}
          locations={[0, 0.2, 0.4, 0.6]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/*
        Blob 3 - Another muted purple (center-left)
        Subtle color temperature variation
      */}
      <Animated.View style={[styles.blob3, blob3Style]}>
        <LinearGradient
          colors={[
            'rgba(70, 50, 100, 0.10)',    // Muted purple
            'rgba(60, 45, 90, 0.06)',     // Fading
            'rgba(50, 40, 80, 0.025)',    // More fading
            'transparent',
          ]}
          locations={[0, 0.2, 0.4, 0.6]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  // MASSIVE blobs - key to creating fog-like diffusion without CSS blur
  blob1: {
    position: 'absolute',
    // Lower center-right - creates subtle purple warmth
    bottom: -400,
    right: -350,
    width: 1000,
    height: 1000,
  },
  blob2: {
    position: 'absolute',
    // Upper right - subtle teal coolness
    top: -400,
    right: -300,
    width: 900,
    height: 900,
  },
  blob3: {
    position: 'absolute',
    // Center-left - subtle purple variation
    top: height * 0.3 - 450,
    left: -400,
    width: 950,
    height: 950,
  },
});
