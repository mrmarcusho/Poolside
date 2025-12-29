import React from 'react';
import { View, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface CustomSplashScreenProps {
  opacity?: Animated.Value;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ opacity }) => {
  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const content = (
    <View style={styles.innerContainer}>
      <Image
        source={require('../../assets/poolside-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );

  if (opacity) {
    return (
      <Animated.View style={[styles.container, { opacity }]}>
        <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
          {content}
        </BlurView>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
        {content}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.9,
    height: 150,
  },
});
