import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MarbleBackgroundProps {
  style?: object;
}

export const MarbleBackground: React.FC<MarbleBackgroundProps> = ({ style }) => {
  // Rotation values for swirling effect
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const rotation3 = useSharedValue(0);

  // Drift values for organic movement
  const drift1X = useSharedValue(0);
  const drift1Y = useSharedValue(0);
  const drift2X = useSharedValue(0);
  const drift2Y = useSharedValue(0);
  const drift3X = useSharedValue(0);
  const drift3Y = useSharedValue(0);

  useEffect(() => {
    // Very slow rotation - 25-35 second full rotations
    rotation1.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );

    rotation2.value = withRepeat(
      withTiming(-360, { duration: 35000, easing: Easing.linear }),
      -1,
      false
    );

    rotation3.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );

    // Organic drift movements
    drift1X.value = withRepeat(
      withTiming(40, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    drift1Y.value = withRepeat(
      withTiming(-30, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    drift2X.value = withRepeat(
      withTiming(-35, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    drift2Y.value = withRepeat(
      withTiming(25, { duration: 13000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    drift3X.value = withRepeat(
      withTiming(30, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    drift3Y.value = withRepeat(
      withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const vein1Style = useAnimatedStyle(() => {
    const swayX = interpolate(rotation1.value, [0, 180, 360], [0, 30, 0]);
    const swayY = interpolate(rotation1.value, [0, 180, 360], [0, -20, 0]);

    return {
      transform: [
        { translateX: drift1X.value + swayX },
        { translateY: drift1Y.value + swayY },
        { rotate: `${rotation1.value * 0.3}deg` },
      ],
    };
  });

  const vein2Style = useAnimatedStyle(() => {
    const swayX = interpolate(rotation2.value, [0, -180, -360], [0, -25, 0]);
    const swayY = interpolate(rotation2.value, [0, -180, -360], [0, 15, 0]);

    return {
      transform: [
        { translateX: drift2X.value + swayX },
        { translateY: drift2Y.value + swayY },
        { rotate: `${rotation2.value * 0.25}deg` },
      ],
    };
  });

  const vein3Style = useAnimatedStyle(() => {
    const swayX = interpolate(rotation3.value, [0, 180, 360], [0, 20, 0]);
    const swayY = interpolate(rotation3.value, [0, 180, 360], [0, -25, 0]);

    return {
      transform: [
        { translateX: drift3X.value + swayX },
        { translateY: drift3Y.value + swayY },
        { rotate: `${rotation3.value * 0.2}deg` },
      ],
    };
  });

  const goldVein1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift1X.value * 0.5 },
      { translateY: drift1Y.value * 0.5 },
      { rotate: `${rotation1.value * 0.15}deg` },
    ],
  }));

  const goldVein2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift2X.value * 0.6 },
      { translateY: drift2Y.value * 0.4 },
      { rotate: `${rotation2.value * 0.1}deg` },
    ],
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Dark marble base */}
      <LinearGradient
        colors={['#1a1a1a', '#222222', '#1c1c1c', '#181818']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Main marble vein 1 - gray streak */}
      <Animated.View style={[styles.vein1, vein1Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(90, 90, 90, 0.08)',
            'rgba(120, 120, 120, 0.12)',
            'rgba(90, 90, 90, 0.08)',
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.veinGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Marble vein 2 - lighter gray */}
      <Animated.View style={[styles.vein2, vein2Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(100, 100, 100, 0.06)',
            'rgba(140, 140, 140, 0.10)',
            'rgba(100, 100, 100, 0.06)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.veinGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Marble vein 3 - subtle dark */}
      <Animated.View style={[styles.vein3, vein3Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(70, 70, 70, 0.05)',
            'rgba(95, 95, 95, 0.08)',
            'rgba(70, 70, 70, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.veinGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Gold vein 1 - accent */}
      <Animated.View style={[styles.goldVein1, goldVein1Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(212, 175, 55, 0.04)',
            'rgba(218, 165, 32, 0.08)',
            'rgba(212, 175, 55, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.goldGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Gold vein 2 - secondary accent */}
      <Animated.View style={[styles.goldVein2, goldVein2Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 215, 0, 0.03)',
            'rgba(218, 165, 32, 0.06)',
            'rgba(255, 215, 0, 0.03)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.goldGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Subtle crystalline highlights */}
      <View style={styles.highlight1}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.03)',
            'rgba(200, 200, 200, 0.015)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.highlightGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <View style={styles.highlight2}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.025)',
            'rgba(180, 180, 180, 0.012)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.highlightGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  veinGradient: {
    width: '100%',
    height: '100%',
  },
  goldGradient: {
    width: '100%',
    height: '100%',
  },
  highlightGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  vein1: {
    position: 'absolute',
    top: height * 0.1,
    left: -200,
    width: width + 400,
    height: 300,
    transform: [{ rotate: '-15deg' }],
  },
  vein2: {
    position: 'absolute',
    top: height * 0.4,
    left: -150,
    width: width + 300,
    height: 250,
    transform: [{ rotate: '25deg' }],
  },
  vein3: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -100,
    width: width + 200,
    height: 200,
    transform: [{ rotate: '-30deg' }],
  },
  goldVein1: {
    position: 'absolute',
    top: height * 0.25,
    left: -100,
    width: width + 200,
    height: 150,
    transform: [{ rotate: '10deg' }],
  },
  goldVein2: {
    position: 'absolute',
    bottom: height * 0.3,
    right: -100,
    width: 200,
    height: height * 0.4,
    transform: [{ rotate: '-5deg' }],
  },
  highlight1: {
    position: 'absolute',
    top: height * 0.2,
    right: -50,
    width: 300,
    height: 300,
  },
  highlight2: {
    position: 'absolute',
    bottom: height * 0.25,
    left: -30,
    width: 250,
    height: 250,
  },
});
