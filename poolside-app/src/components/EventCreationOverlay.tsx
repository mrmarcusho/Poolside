import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEventCreationAnimation } from '../context/EventCreationAnimationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

export const EventCreationOverlay: React.FC = () => {
  const { animationState, onAnimationComplete } = useEventCreationAnimation();
  const { isAnimating, startPosition, targetPosition, eventData } = animationState;

  // Animation values
  const cardProgress = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;
  const pulseScale = useRef(new Animated.Value(0.5)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  // Trail particles
  const [trailParticles, setTrailParticles] = useState<Particle[]>([]);
  const [burstParticles, setBurstParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isAnimating && startPosition && targetPosition) {
      runAnimation();
    }
  }, [isAnimating, startPosition, targetPosition]);

  const createTrailParticle = (index: number, startX: number, startY: number, endX: number, endY: number) => {
    const particle: Particle = {
      id: Date.now() + index,
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
      color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
    };

    setTimeout(() => {
      setTrailParticles(prev => [...prev, particle]);

      Animated.sequence([
        Animated.timing(particle.opacity, {
          toValue: 0.8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(particle.x, {
            toValue: endX,
            duration: 600 - index * 30,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: endY,
            duration: 600 - index * 30,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.3,
            duration: 600 - index * 30,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        setTrailParticles(prev => prev.filter(p => p.id !== particle.id));
      });
    }, index * 40);
  };

  const createBurstParticles = (centerX: number, centerY: number) => {
    const numParticles = 12;
    const newParticles: Particle[] = [];

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const distance = 40 + Math.random() * 30;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;

      const particle: Particle = {
        id: Date.now() + i + 100,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      };

      newParticles.push(particle);

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: targetY,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setBurstParticles(prev => prev.filter(p => p.id !== particle.id));
      });
    }

    setBurstParticles(newParticles);
  };

  const runAnimation = () => {
    if (!startPosition || !targetPosition) return;

    // Reset values
    cardProgress.setValue(0);
    cardOpacity.setValue(1);
    successOpacity.setValue(0);
    successScale.setValue(0.8);
    pulseScale.setValue(0.5);
    pulseOpacity.setValue(0);

    const startX = startPosition.x + startPosition.width / 2;
    const startY = startPosition.y + startPosition.height / 2;
    const endX = targetPosition.x + targetPosition.width / 2;
    const endY = targetPosition.y + 20;

    // Create trail particles
    for (let i = 0; i < 8; i++) {
      createTrailParticle(i, startX, startY, endX, endY);
    }

    // Main card animation
    Animated.parallel([
      Animated.timing(cardProgress, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Haptic feedback when landing
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Pulse effect on target
      Animated.parallel([
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 2,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Create burst particles
      createBurstParticles(endX, endY);

      // Show success message
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1,
            stiffness: 200,
            damping: 15,
            useNativeDriver: true,
          }),
        ]).start();

        // Hide success and complete
        setTimeout(() => {
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onAnimationComplete();
          });
        }, 2000);
      }, 200);
    });
  };

  if (!isAnimating || !startPosition || !targetPosition || !eventData) {
    return null;
  }

  const startX = startPosition.x + startPosition.width / 2;
  const startY = startPosition.y + startPosition.height / 2;
  const endX = targetPosition.x + targetPosition.width / 2;
  const endY = targetPosition.y + 20;

  // Calculate card position along arc
  const cardTranslateX = cardProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, endX - startX],
  });

  // Arc movement (parabola)
  const arcHeight = -150;
  const cardTranslateY = cardProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, arcHeight, endY - startY],
  });

  const cardScale = cardProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.05],
  });

  const cardRotation = cardProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Animated Event Card Preview */}
      <Animated.View
        style={[
          styles.cardPreview,
          {
            left: startPosition.x,
            top: startPosition.y,
            width: startPosition.width,
            height: startPosition.height,
            opacity: cardOpacity,
            transform: [
              { translateX: cardTranslateX },
              { translateY: cardTranslateY },
              { scale: cardScale },
              { rotate: cardRotation },
            ],
          },
        ]}
      >
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {eventData.title}
          </Text>
          <View
            style={[
              styles.cardCover,
              { backgroundColor: eventData.coverColor || '#667eea' },
            ]}
          />
          <Text style={styles.cardDetails} numberOfLines={1}>
            {eventData.dateTime}
          </Text>
          <Text style={styles.cardDetails} numberOfLines={1}>
            {eventData.location}
          </Text>
        </BlurView>
      </Animated.View>

      {/* Trail Particles */}
      {trailParticles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: Animated.subtract(particle.x, new Animated.Value(10)) },
                { translateY: Animated.subtract(particle.y, new Animated.Value(10)) },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Burst Particles */}
      {burstParticles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.burstParticle,
            {
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: Animated.subtract(particle.x, new Animated.Value(4)) },
                { translateY: Animated.subtract(particle.y, new Animated.Value(4)) },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Pulse Ring on Target */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            left: endX - 25,
            top: endY - 25,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      {/* Success Message */}
      <Animated.View
        style={[
          styles.successContainer,
          {
            opacity: successOpacity,
            transform: [{ scale: successScale }],
          },
        ]}
      >
        <BlurView intensity={60} tint="dark" style={styles.successContent}>
          <Text style={styles.successIcon}>✨</Text>
          <Text style={styles.successText}>Event Created!</Text>
          <Text style={styles.successSubtext}>Added to your feed</Text>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  cardPreview: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardCover: {
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  burstParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  successContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    padding: 24,
    paddingHorizontal: 48,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  successSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
});
