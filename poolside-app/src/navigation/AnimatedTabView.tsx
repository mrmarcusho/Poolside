import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedTabViewProps {
  screens: React.ReactNode[];
  activeIndex: number;
}

/**
 * Custom animated tab view that slides between screens.
 * All screens are pre-rendered and we animate the container position.
 * This prevents black screens because content is always rendered.
 */
export const AnimatedTabView: React.FC<AnimatedTabViewProps> = ({
  screens,
  activeIndex,
}) => {
  const translateX = useSharedValue(-activeIndex * SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(-activeIndex * SCREEN_WIDTH, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    });
  }, [activeIndex, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slidingContainer, animatedStyle]}>
        {screens.map((screen, index) => (
          <View key={index} style={styles.screen}>
            {screen}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  slidingContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
