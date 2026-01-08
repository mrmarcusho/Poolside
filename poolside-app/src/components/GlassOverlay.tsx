import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassOverlayProps {
  style?: object;
}

export const GlassOverlay: React.FC<GlassOverlayProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Dark semi-transparent overlay */}
      <View style={styles.darkOverlay} />
      {/* Blur effect */}
      <BlurView intensity={30} tint="dark" style={styles.blurView} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 8, 0.7)',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
});
