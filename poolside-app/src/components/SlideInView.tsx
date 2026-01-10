import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface SlideInViewProps {
  children: React.ReactNode;
  /** Tab index of this screen (0-4) */
  tabIndex: number;
}

/**
 * Wrapper that provides a smooth slide animation when switching tabs.
 * Content is always visible - we just animate position for a nice effect.
 */
export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  tabIndex,
}) => {
  const isFocused = useIsFocused();
  const prevFocused = useRef(isFocused);

  // Start at 0 (visible), only animate on focus change
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused && !prevFocused.current) {
      // Coming into focus - slide in from slight offset with scale
      translateX.value = 30;
      scale.value = 0.95;

      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 150,
        mass: 0.6,
      });
      scale.value = withSpring(1, {
        damping: 18,
        stiffness: 150,
        mass: 0.6,
      });
    } else if (!isFocused && prevFocused.current) {
      // Losing focus - subtle scale down
      scale.value = withSpring(0.98, {
        damping: 20,
        stiffness: 200,
      });
    }

    prevFocused.current = isFocused;
  }, [isFocused, translateX, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
