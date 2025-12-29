import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface MetallicLogoProps {
  size?: number;
}

export const MetallicLogo: React.FC<MetallicLogoProps> = ({ size = 28 }) => {
  const fontSize = size;

  return (
    <View style={styles.container}>
      {/* Shadow layers for 3D effect */}
      <Text style={[styles.shadowLayer, styles.shadow3, { fontSize }]}>Poolside</Text>
      <Text style={[styles.shadowLayer, styles.shadow2, { fontSize }]}>Poolside</Text>
      <Text style={[styles.shadowLayer, styles.shadow1, { fontSize }]}>Poolside</Text>

      {/* Main metallic text with gradient */}
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <Text style={[styles.logoText, { fontSize }]}>Poolside</Text>
        }
      >
        <LinearGradient
          colors={[
            '#e8e8e8',
            '#f5f5f5',
            '#ffffff',
            '#d0d0d0',
            '#a8a8a8',
            '#c0c0c0',
            '#e0e0e0',
            '#f8f8f8',
            '#d8d8d8',
            '#b0b0b0',
          ]}
          locations={[0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1]}
          style={styles.gradient}
        />
      </MaskedView>

      {/* Highlight overlay */}
      <MaskedView
        style={[styles.maskedView, styles.highlightLayer]}
        maskElement={
          <Text style={[styles.logoText, { fontSize }]}>Poolside</Text>
        }
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.6)',
            'rgba(255,255,255,0.2)',
            'transparent',
            'transparent',
            'rgba(255,255,255,0.1)',
          ]}
          locations={[0, 0.2, 0.4, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </MaskedView>
    </View>
  );
};

// Simple fallback version without MaskedView (in case of issues)
export const MetallicLogoSimple: React.FC<MetallicLogoProps> = ({ size = 28 }) => {
  return (
    <View style={styles.simpleContainer}>
      {/* Shadow layers */}
      <Text style={[styles.simpleShadow3, { fontSize: size }]}>Poolside</Text>
      <Text style={[styles.simpleShadow2, { fontSize: size }]}>Poolside</Text>
      <Text style={[styles.simpleShadow1, { fontSize: size }]}>Poolside</Text>
      {/* Main text */}
      <Text style={[styles.simpleMain, { fontSize: size }]}>Poolside</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  maskedView: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradient: {
    height: 50,
    width: 150,
  },
  logoText: {
    fontFamily: 'Baloo2_800ExtraBold',
    color: 'black',
    letterSpacing: -0.5,
  },
  shadowLayer: {
    fontFamily: 'Baloo2_800ExtraBold',
    position: 'absolute',
    letterSpacing: -0.5,
  },
  shadow1: {
    color: 'rgba(0,0,0,0.08)',
    top: 2,
    left: 2,
  },
  shadow2: {
    color: 'rgba(0,0,0,0.06)',
    top: 4,
    left: 3,
  },
  shadow3: {
    color: 'rgba(0,0,0,0.04)',
    top: 6,
    left: 4,
  },
  highlightLayer: {
    opacity: 0.5,
  },

  // Simple version styles (fallback)
  simpleContainer: {
    position: 'relative',
  },
  simpleShadow1: {
    fontFamily: 'Baloo2_800ExtraBold',
    position: 'absolute',
    color: 'rgba(0,0,0,0.1)',
    top: 2,
    left: 2,
    letterSpacing: -0.5,
  },
  simpleShadow2: {
    fontFamily: 'Baloo2_800ExtraBold',
    position: 'absolute',
    color: 'rgba(0,0,0,0.07)',
    top: 4,
    left: 3,
    letterSpacing: -0.5,
  },
  simpleShadow3: {
    fontFamily: 'Baloo2_800ExtraBold',
    position: 'absolute',
    color: 'rgba(0,0,0,0.04)',
    top: 6,
    left: 4,
    letterSpacing: -0.5,
  },
  simpleMain: {
    fontFamily: 'Baloo2_800ExtraBold',
    color: '#C0C0C0',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: -1, height: -1 },
    textShadowRadius: 1,
  },
});
