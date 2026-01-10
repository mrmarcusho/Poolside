import React, { useRef, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

interface LottieBackgroundProps {
  source?: any;
  style?: object;
  blurIntensity?: number;
}

// Default animation source
const defaultSource = require('../assets/animations/gradient-background.json');

export const LottieBackground: React.FC<LottieBackgroundProps> = ({
  source = defaultSource,
  style,
  blurIntensity = 50, // Lighter blur to preserve vibrant colors
}) => {
  const animationRef = useRef<LottieView>(null);
  const [isReversed, setIsReversed] = useState(false);

  // Start playing on mount
  useEffect(() => {
    animationRef.current?.play();
  }, []);

  // Handle animation completion - reverse direction for ping-pong effect
  const handleAnimationFinish = useCallback((isCancelled: boolean) => {
    if (isCancelled) return;

    // Toggle direction
    setIsReversed(prev => !prev);

    // Restart the animation (it will play with the new speed direction)
    animationRef.current?.play();
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Lottie animation layer - scaled up for larger blobs */}
      <View style={styles.animationWrapper}>
        <LottieView
          ref={animationRef}
          source={source}
          loop={false}
          speed={isReversed ? -1 : 1}
          resizeMode="cover"
          style={styles.animation}
          onAnimationFinish={handleAnimationFinish}
        />
      </View>

      {/* Blur overlay - lighter blur to preserve color vibrancy */}
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={styles.blurOverlay}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  animationWrapper: {
    ...StyleSheet.absoluteFillObject,
    // Slight scale for better coverage
    transform: [{ scale: 1.1 }],
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
