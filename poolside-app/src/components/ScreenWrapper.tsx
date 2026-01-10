import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ProfileBackground } from './ProfileBackground';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Set to true when screen content is ready to display */
  isReady?: boolean;
  /** Custom background component (defaults to ProfileBackground) */
  background?: React.ReactNode;
  /** Custom loading indicator color */
  loadingColor?: string;
  /** Skip the ready check and show content immediately */
  skipReadyCheck?: boolean;
}

/**
 * Wrapper component that shows a loading state until the screen signals it's ready.
 * This prevents black screens by immediately rendering a placeholder.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  isReady = false,
  background,
  loadingColor = '#667eea',
  skipReadyCheck = false,
}) => {
  // Track if we should show content
  const [showContent, setShowContent] = useState(skipReadyCheck);

  useEffect(() => {
    if (skipReadyCheck) {
      setShowContent(true);
      return;
    }

    if (isReady) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isReady, skipReadyCheck]);

  // Always render the background immediately
  const backgroundElement = background ?? <ProfileBackground />;

  if (!showContent) {
    return (
      <View style={styles.container}>
        {backgroundElement}
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={loadingColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
