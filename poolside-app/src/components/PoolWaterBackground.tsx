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

interface PoolWaterBackgroundProps {
  style?: object;
}

export const PoolWaterBackground: React.FC<PoolWaterBackgroundProps> = ({ style }) => {
  // Wave animation values
  const wave1X = useSharedValue(0);
  const wave2X = useSharedValue(0);
  const wave3X = useSharedValue(0);
  const wave4X = useSharedValue(0);

  // Caustic light effects
  const caustic1Opacity = useSharedValue(0.08);
  const caustic2Opacity = useSharedValue(0.06);

  useEffect(() => {
    // Wave 1 - slow rightward drift
    wave1X.value = withRepeat(
      withTiming(100, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Wave 2 - medium speed leftward
    wave2X.value = withRepeat(
      withTiming(-80, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Wave 3 - faster rightward
    wave3X.value = withRepeat(
      withTiming(60, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Wave 4 - very slow deep wave
    wave4X.value = withRepeat(
      withTiming(-40, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Caustic light shimmer effects
    caustic1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );

    caustic2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.04, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
  }, []);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave1X.value }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave2X.value }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave3X.value }],
  }));

  const wave4Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave4X.value }],
  }));

  const caustic1Style = useAnimatedStyle(() => ({
    opacity: caustic1Opacity.value,
  }));

  const caustic2Style = useAnimatedStyle(() => ({
    opacity: caustic2Opacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Deep ocean base gradient */}
      <LinearGradient
        colors={['#0a1628', '#0d1f3c', '#102a4c', '#0a1628']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Wave layer 1 - deepest, slowest */}
      <Animated.View style={[styles.wave1, wave1Style]}>
        <LinearGradient
          colors={[
            'rgba(26, 74, 122, 0.15)',
            'rgba(35, 95, 150, 0.10)',
            'rgba(45, 106, 160, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={styles.gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Wave layer 2 - mid depth */}
      <Animated.View style={[styles.wave2, wave2Style]}>
        <LinearGradient
          colors={[
            'rgba(45, 106, 160, 0.12)',
            'rgba(61, 143, 192, 0.08)',
            'rgba(75, 160, 210, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={styles.gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Wave layer 3 - shallower */}
      <Animated.View style={[styles.wave3, wave3Style]}>
        <LinearGradient
          colors={[
            'rgba(61, 143, 192, 0.10)',
            'rgba(80, 170, 220, 0.06)',
            'rgba(100, 190, 235, 0.03)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Wave layer 4 - surface ripples */}
      <Animated.View style={[styles.wave4, wave4Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(100, 200, 240, 0.06)',
            'rgba(120, 210, 250, 0.08)',
            'rgba(100, 200, 240, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Caustic light effect 1 */}
      <Animated.View style={[styles.caustic1, caustic1Style]}>
        <LinearGradient
          colors={[
            'rgba(150, 220, 255, 0.3)',
            'rgba(120, 200, 245, 0.15)',
            'transparent',
          ]}
          locations={[0, 0.4, 1]}
          style={styles.causticGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Caustic light effect 2 */}
      <Animated.View style={[styles.caustic2, caustic2Style]}>
        <LinearGradient
          colors={[
            'rgba(140, 215, 255, 0.25)',
            'rgba(100, 190, 240, 0.12)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.causticGradient}
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
  },
  causticGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  wave1: {
    position: 'absolute',
    bottom: -200,
    left: -200,
    width: width + 400,
    height: height * 0.6,
  },
  wave2: {
    position: 'absolute',
    top: height * 0.2,
    left: -150,
    width: width + 300,
    height: height * 0.5,
  },
  wave3: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: width + 200,
    height: height * 0.4,
  },
  wave4: {
    position: 'absolute',
    top: height * 0.1,
    left: -100,
    width: width + 200,
    height: height * 0.3,
  },
  caustic1: {
    position: 'absolute',
    top: height * 0.15,
    right: -100,
    width: 400,
    height: 400,
  },
  caustic2: {
    position: 'absolute',
    top: height * 0.4,
    left: -50,
    width: 350,
    height: 350,
  },
});
