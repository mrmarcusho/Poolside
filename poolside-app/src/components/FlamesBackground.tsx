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

interface FlamesBackgroundProps {
  style?: object;
}

export const FlamesBackground: React.FC<FlamesBackgroundProps> = ({ style }) => {
  // Flame rise animations
  const flame1Y = useSharedValue(0);
  const flame2Y = useSharedValue(0);
  const flame3Y = useSharedValue(0);
  const flame4Y = useSharedValue(0);

  // Flame flicker (opacity)
  const flame1Opacity = useSharedValue(0.12);
  const flame2Opacity = useSharedValue(0.10);
  const flame3Opacity = useSharedValue(0.08);

  // Flame scale pulsing
  const flame1Scale = useSharedValue(1);
  const flame2Scale = useSharedValue(1);

  useEffect(() => {
    // Flame 1 - main rising flame
    flame1Y.value = withRepeat(
      withSequence(
        withTiming(-80, { duration: 4000, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 4000, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false
    );

    // Flame 2 - secondary flame, offset timing
    flame2Y.value = withRepeat(
      withSequence(
        withTiming(-60, { duration: 3500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 3500, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false
    );

    // Flame 3 - side flame
    flame3Y.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 3000, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 3000, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false
    );

    // Flame 4 - background glow
    flame4Y.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );

    // Flicker effects - rapid opacity changes
    flame1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 150, easing: Easing.linear }),
        withTiming(0.10, { duration: 200, easing: Easing.linear }),
        withTiming(0.15, { duration: 180, easing: Easing.linear }),
        withTiming(0.08, { duration: 170, easing: Easing.linear }),
      ),
      -1,
      false
    );

    flame2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.14, { duration: 180, easing: Easing.linear }),
        withTiming(0.08, { duration: 220, easing: Easing.linear }),
        withTiming(0.12, { duration: 160, easing: Easing.linear }),
        withTiming(0.06, { duration: 190, easing: Easing.linear }),
      ),
      -1,
      false
    );

    flame3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 200, easing: Easing.linear }),
        withTiming(0.05, { duration: 250, easing: Easing.linear }),
        withTiming(0.10, { duration: 180, easing: Easing.linear }),
        withTiming(0.04, { duration: 220, easing: Easing.linear }),
      ),
      -1,
      false
    );

    // Scale pulsing
    flame1Scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );

    flame2Scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true
    );
  }, []);

  const flame1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: flame1Y.value },
      { scale: flame1Scale.value },
    ],
    opacity: flame1Opacity.value,
  }));

  const flame2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: flame2Y.value },
      { scale: flame2Scale.value },
    ],
    opacity: flame2Opacity.value,
  }));

  const flame3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: flame3Y.value }],
    opacity: flame3Opacity.value,
  }));

  const flame4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: flame4Y.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Dark ember base */}
      <LinearGradient
        colors={['#0a0505', '#1a0a0a', '#150808', '#0a0505']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background ember glow */}
      <Animated.View style={[styles.flame4, flame4Style]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(74, 26, 10, 0.08)',
            'rgba(100, 30, 10, 0.12)',
            'rgba(139, 37, 0, 0.08)',
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.gradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Main flame 1 - center */}
      <Animated.View style={[styles.flame1, flame1Style]}>
        <LinearGradient
          colors={[
            'rgba(255, 140, 0, 0.25)',
            'rgba(255, 69, 0, 0.18)',
            'rgba(139, 37, 0, 0.12)',
            'rgba(74, 26, 10, 0.06)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.flameGradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Flame 2 - right side */}
      <Animated.View style={[styles.flame2, flame2Style]}>
        <LinearGradient
          colors={[
            'rgba(255, 100, 0, 0.20)',
            'rgba(255, 60, 0, 0.15)',
            'rgba(180, 40, 0, 0.10)',
            'rgba(100, 25, 5, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.55, 0.8, 1]}
          style={styles.flameGradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Flame 3 - left side */}
      <Animated.View style={[styles.flame3, flame3Style]}>
        <LinearGradient
          colors={[
            'rgba(255, 120, 0, 0.18)',
            'rgba(255, 80, 0, 0.12)',
            'rgba(160, 35, 0, 0.08)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={styles.flameGradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Hot ember spots */}
      <View style={styles.ember1}>
        <LinearGradient
          colors={[
            'rgba(255, 200, 100, 0.08)',
            'rgba(255, 140, 50, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.emberGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <View style={styles.ember2}>
        <LinearGradient
          colors={[
            'rgba(255, 180, 80, 0.06)',
            'rgba(255, 120, 40, 0.03)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.emberGradient}
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
  gradient: {
    width: '100%',
    height: '100%',
  },
  flameGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  emberGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  flame1: {
    position: 'absolute',
    bottom: -100,
    left: width * 0.2,
    width: width * 0.6,
    height: height * 0.7,
  },
  flame2: {
    position: 'absolute',
    bottom: -80,
    right: -50,
    width: width * 0.5,
    height: height * 0.6,
  },
  flame3: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: width * 0.5,
    height: height * 0.55,
  },
  flame4: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.8,
  },
  ember1: {
    position: 'absolute',
    bottom: height * 0.2,
    left: width * 0.3,
    width: 200,
    height: 200,
  },
  ember2: {
    position: 'absolute',
    bottom: height * 0.35,
    right: width * 0.2,
    width: 150,
    height: 150,
  },
});
