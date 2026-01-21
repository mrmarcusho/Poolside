import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors
const COLORS = {
  bgDark: '#050508',
  coral: '#ff6b4a',
  coralGlow: 'rgba(255, 107, 74, 0.4)',
  violet: '#8b5cf6',
  violetGlow: 'rgba(139, 92, 246, 0.3)',
  cyan: '#22d3ee',
  teal: '#2dd4bf',
  pink: '#f472b6',
  amber: '#fbbf24',
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(0, 0, 0, 0.5)',
};

// Floating event text data
const FLOATING_EVENTS = [
  { emoji: '🎵', title: 'Lorde Listening Party in the Courts', time: '3pm' },
  { emoji: '⚽️', title: 'Pickup Soccer on Bello', time: '30 min' },
  { emoji: '🃏', title: 'Poker Night in Miller', time: '8pm' },
  { emoji: '🧀', title: 'Cheese Club Meeting in Eaton', time: 'Tomorrow' },
];

interface WelcomeScreenProps {
  onComplete: () => void;
}

// Animated floating orb component
const FloatingOrb = ({
  size,
  color,
  initialX,
  initialY,
  delay = 0
}: {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  delay?: number;
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: initialX,
          top: initialY,
          opacity: 0.5,
        },
        animatedStyle,
      ]}
    />
  );
};

// Music note animation
const MusicNote = ({ note, delay, x, y }: { note: string; delay: number; x: number; y: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.5);

  React.useEffect(() => {
    const animate = () => {
      opacity.value = 0;
      translateY.value = 20;
      scale.value = 0.5;

      opacity.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 600 })
      ));
      translateY.value = withDelay(delay, withTiming(-40, { duration: 3000 }));
      scale.value = withDelay(delay, withTiming(1, { duration: 3000 }));
    };

    animate();
    const interval = setInterval(animate, 3000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', fontSize: 24, left: x, top: y }, animatedStyle]}>
      {note}
    </Animated.Text>
  );
};

// Progress dots
const ProgressDots = ({ currentSection, totalSections }: { currentSection: number; totalSections: number }) => {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: totalSections }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            currentSection === i && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );
};

// Confetti piece
const ConfettiPiece = ({
  color,
  delay,
  x,
  isCircle
}: {
  color: string;
  delay: number;
  x: number;
  isCircle: boolean;
}) => {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT, { duration: 3000 }));
    rotate.value = withDelay(delay, withTiming(720, { duration: 3000 }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 2400 }),
      withTiming(0, { duration: 500 })
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 10,
          height: 10,
          backgroundColor: color,
          left: x,
          top: 0,
          borderRadius: isCircle ? 5 : 0,
        },
        animatedStyle,
      ]}
    />
  );
};

// Floating event text with fade-in animation
const FloatingEventText = ({
  emoji,
  title,
  time,
  delay,
  style,
}: {
  emoji: string;
  title: string;
  time: string;
  delay: number;
  style?: object;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.floatingText, style, animatedStyle]}>
      <Text style={styles.floatingEmoji}>{emoji}</Text>
      <Text style={styles.floatingTitle}>{title}</Text>
      <Text style={styles.floatingTime}>{time}</Text>
    </Animated.View>
  );
};

// Discover Section with floating event texts
const DiscoverSection = ({ isVisible }: { isVisible: boolean }) => {
  const [hasAnimated, setHasAnimated] = useState(false);

  // Trigger animation once when section becomes visible
  React.useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isVisible, hasAnimated]);

  return (
    <View style={styles.section}>
      {/* Text group */}
      <View style={styles.discoverTextGroup}>
        <Text style={styles.discoverTitle}>
          Discover <Text style={styles.discoverTitleHighlight}>events</Text>
          {'\n'}happening now
        </Text>
        <Text style={styles.discoverSubtitle}>
          See what your classmates are up to right now
        </Text>
      </View>

      {/* Floating event texts - render once hasAnimated is true */}
      {hasAnimated && (
        <View style={styles.floatingContainer}>
          <FloatingEventText
            {...FLOATING_EVENTS[0]}
            delay={200}
            style={styles.ft1}
          />
          <FloatingEventText
            {...FLOATING_EVENTS[1]}
            delay={500}
            style={styles.ft2}
          />
          <FloatingEventText
            {...FLOATING_EVENTS[2]}
            delay={800}
            style={styles.ft3}
          />
          <FloatingEventText
            {...FLOATING_EVENTS[3]}
            delay={1100}
            style={styles.ft4}
          />
        </View>
      )}

      {/* Scroll indicator */}
      <View style={styles.discoverScrollIndicator}>
        <Text style={styles.scrollHintText}>SCROLL</Text>
        <View style={styles.scrollArrow} />
      </View>
    </View>
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animations
  const greetingOpacity = useSharedValue(1);
  const greetingTranslateY = useSharedValue(0);
  const mascotScale = useSharedValue(0);
  const mascotGlow = useSharedValue(0.6);

  // Initialize animations
  React.useEffect(() => {
    mascotScale.value = withDelay(200, withSpring(1, { damping: 12 }));
    mascotGlow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const sectionIndex = Math.round(offsetY / SCREEN_HEIGHT);

    if (sectionIndex !== currentSection) {
      setCurrentSection(sectionIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Show confetti when reaching CTA section (section 2)
      if (sectionIndex === 2 && !showConfetti) {
        setShowConfetti(true);
      }
    }
  }, [currentSection, showConfetti]);

  const scrollToSection = (index: number) => {
    scrollViewRef.current?.scrollTo({ y: index * SCREEN_HEIGHT, animated: true });
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete();
  };

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const mascotGlowStyle = useAnimatedStyle(() => ({
    opacity: mascotGlow.value,
    transform: [{ scale: mascotGlow.value + 0.4 }],
  }));

  return (
    <View style={styles.container}>
      {/* Fixed background image */}
      <Image
        source={require('../assets/images/welcome-background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Progress dots */}
      <ProgressDots currentSection={currentSection} totalSections={3} />

      {/* Scrollable sections */}
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
      >
        {/* Section 1: Greeting */}
        <View style={styles.section}>
          <SafeAreaView style={styles.sectionContent}>
            <View style={styles.mascotContainer}>
              <Animated.View style={mascotAnimatedStyle}>
                <Image
                  source={require('../assets/images/mascot-dj-elephant.png')}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <View style={styles.musicNotes}>
                <MusicNote note="🎵" delay={0} x={-20} y={40} />
                <MusicNote note="🎶" delay={500} x={180} y={60} />
                <MusicNote note="♪" delay={1000} x={10} y={160} />
                <MusicNote note="♫" delay={1500} x={170} y={140} />
              </View>
            </View>

            <Text style={styles.greetingText}>Hey there!</Text>
            <Text style={styles.greetingSubtitle}>Ready to dive in?</Text>

            <View style={styles.scrollHint}>
              <Text style={styles.scrollHintText}>SCROLL TO EXPLORE</Text>
              <View style={styles.scrollArrow} />
            </View>
          </SafeAreaView>
        </View>

        {/* Section 2: Discover */}
        <DiscoverSection isVisible={currentSection === 1} />

        {/* Section 3: CTA */}
        <View style={styles.section}>
          <SafeAreaView style={styles.sectionContent}>
            {/* Confetti */}
            {showConfetti && (
              <View style={styles.confettiContainer}>
                <ConfettiPiece color={COLORS.coral} delay={0} x={SCREEN_WIDTH * 0.1} isCircle />
                <ConfettiPiece color={COLORS.violet} delay={100} x={SCREEN_WIDTH * 0.2} isCircle={false} />
                <ConfettiPiece color={COLORS.cyan} delay={200} x={SCREEN_WIDTH * 0.3} isCircle />
                <ConfettiPiece color={COLORS.pink} delay={150} x={SCREEN_WIDTH * 0.4} isCircle={false} />
                <ConfettiPiece color={COLORS.coral} delay={250} x={SCREEN_WIDTH * 0.5} isCircle />
                <ConfettiPiece color={COLORS.violet} delay={50} x={SCREEN_WIDTH * 0.6} isCircle={false} />
                <ConfettiPiece color={COLORS.cyan} delay={300} x={SCREEN_WIDTH * 0.7} isCircle />
                <ConfettiPiece color={COLORS.amber} delay={200} x={SCREEN_WIDTH * 0.8} isCircle={false} />
                <ConfettiPiece color={COLORS.coral} delay={100} x={SCREEN_WIDTH * 0.9} isCircle={false} />
                <ConfettiPiece color={COLORS.teal} delay={350} x={SCREEN_WIDTH * 0.15} isCircle />
              </View>
            )}

            {/* Jumbo peeking mascot */}
            <View style={styles.jumboPeekingContainer}>
              <Image
                source={require('../assets/images/jumbo-peeking.png')}
                style={styles.jumboPeekingImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.ctaTitle}>JumboHQ</Text>
            <Text style={styles.ctaSubtitle}>Your campus. Your community.</Text>

            <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={[COLORS.coral, COLORS.violet]}
                style={styles.ctaButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.ctaButtonText}>Let's Dive In</Text>
                <Text style={styles.ctaButtonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms</Text> &{' '}
              <Text style={styles.termsLink}>Privacy</Text>
            </Text>
          </SafeAreaView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  section: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  sectionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Progress dots
  progressDots: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: [{ translateY: -40 }],
    zIndex: 100,
    gap: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  progressDotActive: {
    backgroundColor: COLORS.coral,
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    transform: [{ scale: 1.4 }],
  },

  // Section 1: Greeting
  mascotContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.violet,
  },
  mascotImage: {
    width: 200,
    height: 200,
  },
  musicNotes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  greetingText: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: -45,
    fontFamily: 'Syne_700Bold',
  },
  greetingSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 8,
  },
  scrollHintText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  scrollArrow: {
    width: 24,
    height: 24,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.textSecondary,
    transform: [{ rotate: '45deg' }],
  },

  // Section 2: Discover with scroll animation
  discoverBadgeFixed: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 74, 0.15)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.3)',
    alignSelf: 'center',
    marginHorizontal: 'auto',
    width: 160,
    zIndex: 10,
  },
  discoverTextGroup: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  discoverCardContainer: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  discoverEventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  discoverCardTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  discoverCardLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  discoverCardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  discoverCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  discoverScrollIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  // Card stack styles for DiscoverSection
  discoverCardStackContainer: {
    position: 'absolute',
    bottom: 100, // Position from bottom like the preview card
    left: 24,
    right: 24,
    height: 380,
    zIndex: 5,
  },
  discoverSwipeCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  discoverCardIndicators: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  discoverSwipeHint: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  discoverSwipeHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  discoverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 74, 0.15)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.3)',
    marginBottom: 16,
  },
  discoverBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.coral,
  },
  discoverBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.coral,
  },
  discoverTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 46,
    fontFamily: 'Syne_700Bold',
  },
  discoverTitleHighlight: {
    color: COLORS.coral,
  },
  discoverSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginTop: 12,
  },

  // Floating event text styles
  floatingContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 + 20,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 5,
  },
  floatingText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  floatingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  floatingTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.coral,
    marginLeft: 6,
  },
  // Positioned styles for each floating text (alternating left/right)
  ft1: { left: 20, top: 0 },
  ft2: { right: 20, top: 70 },
  ft3: { left: 30, top: 140 },
  ft4: { right: 25, top: 210 },

  cardStackPreview: {
    position: 'relative',
    width: 280,
    height: 340,
    marginTop: 32,
  },
  previewCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  previewCard1: {
    zIndex: 3,
    backgroundColor: 'rgba(255, 107, 74, 0.12)',
  },
  previewCard2: {
    zIndex: 2,
    transform: [{ translateY: 16 }, { scale: 0.95 }],
    opacity: 0.7,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  previewCard3: {
    zIndex: 1,
    transform: [{ translateY: 32 }, { scale: 0.9 }],
    opacity: 0.4,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  previewCardEmoji: {
    fontSize: 44,
  },
  previewCardTime: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 107, 74, 0.2)',
    borderRadius: 100,
  },
  previewCardTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.coral,
  },
  previewCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  previewCardLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  swipeHintIcon: {
    fontSize: 18,
  },
  swipeHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Section 3: Swipe Cards
  swipeContainer: {
    position: 'relative',
    width: 320,
    height: 440,
    marginTop: 50, // Room for stacked cards peeking from top
  },
  swipeCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  swipeCardGradient: {
    flex: 1,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardEmoji: {
    fontSize: 56,
  },
  cardTimeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  cardTimeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLocationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  attendeesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attendeeAvatars: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeAvatarText: {
    fontSize: 14,
  },
  attendeeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rsvpButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rsvpButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cardIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  cardIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardIndicatorActive: {
    width: 24,
    borderRadius: 4,
  },
  swipeArrows: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  swipeArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeArrowText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  // Section 3: CTA
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  jumboPeekingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -60,
  },
  jumboPeekingImage: {
    width: 280,
    height: 168,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
  },
  logoRing1: {
    width: 180,
    height: 180,
    borderColor: 'rgba(255, 107, 74, 0.2)',
  },
  logoRing2: {
    width: 220,
    height: 220,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  logoRing3: {
    width: 260,
    height: 260,
    borderColor: 'rgba(34, 211, 238, 0.1)',
  },
  logoLarge: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  logoEmoji: {
    fontSize: 64,
  },
  ctaTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: 'Syne_700Bold',
  },
  ctaSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 40,
  },
  ctaButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 56,
    paddingVertical: 22,
  },
  ctaButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
  },
  ctaButtonArrow: {
    fontSize: 19,
    color: '#fff',
  },
  terms: {
    marginTop: 28,
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});
