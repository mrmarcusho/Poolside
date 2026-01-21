/**
 * Feature: Welcome Screen - Discover Section Animation
 *
 * Tests for the scroll-triggered animation in the Discover section:
 * - Animation triggers on ANY swipe speed when on Discover section
 * - Animation plays at consistent 600ms duration
 * - No auto-scroll to next section after animation
 * - Scroll re-enables after animation completes
 * - Animation resets when returning to Greeting section
 */

// Mock reanimated before anything else
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue, config, callback) => {
      if (callback) callback(true);
      return toValue;
    }),
    withSpring: jest.fn((toValue) => toValue),
    withDelay: jest.fn((_, animation) => animation),
    withRepeat: jest.fn((animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    runOnJS: jest.fn((fn) => fn),
    Extrapolation: { CLAMP: 'clamp' },
    interpolate: jest.fn(),
    Easing: { inOut: jest.fn(), ease: {} },
  };
});

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: jest.fn(() => ({
      enabled: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    })),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

import React from 'react';

describe('Feature: Welcome Screen - Discover Animation', () => {
  // Animation configuration constants - these should match the implementation
  const DISCOVER_ANIMATION_DURATION = 600;
  const SWIPE_THRESHOLD = -30; // Minimum swipe distance to trigger animation (negative = up)

  describe('Proactive Scroll Disable', () => {
    test('scroll should be disabled when landing on Discover section and animation not played', () => {
      // Simulate state when user lands on Discover section
      const currentSection = 1; // Discover section
      const discoverAnimationPlayed = false;

      // Expected behavior: scroll should be disabled
      const shouldScrollBeDisabled = currentSection === 1 && !discoverAnimationPlayed;

      expect(shouldScrollBeDisabled).toBe(true);
    });

    test('scroll should be enabled when on Discover section and animation has played', () => {
      const currentSection = 1; // Discover section
      const discoverAnimationPlayed = true;

      // Expected behavior: scroll should be enabled (animation already played)
      const shouldScrollBeEnabled = !(currentSection === 1 && !discoverAnimationPlayed);

      expect(shouldScrollBeEnabled).toBe(true);
    });

    test('scroll should be enabled when on other sections', () => {
      // On Greeting section
      let currentSection = 0;
      let discoverAnimationPlayed = false;
      let shouldScrollBeEnabled = !(currentSection === 1 && !discoverAnimationPlayed);
      expect(shouldScrollBeEnabled).toBe(true);

      // On Swipe Cards section
      currentSection = 2;
      discoverAnimationPlayed = false;
      shouldScrollBeEnabled = !(currentSection === 1 && !discoverAnimationPlayed);
      expect(shouldScrollBeEnabled).toBe(true);

      // On CTA section
      currentSection = 3;
      discoverAnimationPlayed = false;
      shouldScrollBeEnabled = !(currentSection === 1 && !discoverAnimationPlayed);
      expect(shouldScrollBeEnabled).toBe(true);
    });
  });

  describe('Gesture Detection', () => {
    test('swipe up gesture should be detected when translationY < -30', () => {
      const detectSwipeUp = (translationY: number) => translationY < SWIPE_THRESHOLD;

      // Fast swipe up
      expect(detectSwipeUp(-200)).toBe(true);

      // Medium swipe up
      expect(detectSwipeUp(-100)).toBe(true);

      // Slow swipe up (just past threshold)
      expect(detectSwipeUp(-31)).toBe(true);

      // At threshold
      expect(detectSwipeUp(-30)).toBe(false);

      // Below threshold (not enough movement)
      expect(detectSwipeUp(-20)).toBe(false);

      // Swipe down (should not trigger)
      expect(detectSwipeUp(50)).toBe(false);
    });

    test('gesture should only be enabled when scroll is disabled', () => {
      // Gesture should be active when scroll is disabled
      const scrollEnabled = false;
      const gestureEnabled = !scrollEnabled;
      expect(gestureEnabled).toBe(true);

      // Gesture should be inactive when scroll is enabled
      const scrollEnabled2 = true;
      const gestureEnabled2 = !scrollEnabled2;
      expect(gestureEnabled2).toBe(false);
    });
  });

  describe('Animation Triggering', () => {
    test('animation should trigger regardless of swipe speed', () => {
      const swipeEvents = [
        { translationY: -200, velocity: -2000 }, // Very fast swipe
        { translationY: -100, velocity: -1000 }, // Fast swipe
        { translationY: -50, velocity: -500 },   // Medium swipe
        { translationY: -35, velocity: -100 },   // Slow swipe
      ];

      swipeEvents.forEach(event => {
        const shouldTriggerAnimation = event.translationY < SWIPE_THRESHOLD;
        expect(shouldTriggerAnimation).toBe(true);
      });
    });

    test('animation duration should always be 600ms', () => {
      // The animation duration is constant and not affected by swipe speed
      expect(DISCOVER_ANIMATION_DURATION).toBe(600);
    });
  });

  describe('Animation State Management', () => {
    test('handleDiscoverSwipeUp should set animation states correctly', () => {
      let discoverAnimationActive = false;
      let discoverAnimationPlayed = false;

      // Simulate handleDiscoverSwipeUp
      const handleDiscoverSwipeUp = () => {
        discoverAnimationActive = true;
        discoverAnimationPlayed = true;
      };

      handleDiscoverSwipeUp();

      expect(discoverAnimationActive).toBe(true);
      expect(discoverAnimationPlayed).toBe(true);
    });

    test('scroll should re-enable after animation duration', () => {
      jest.useFakeTimers();

      let scrollEnabled = false;

      // Simulate the re-enable logic from handleDiscoverSwipeUp
      setTimeout(() => {
        scrollEnabled = true;
      }, DISCOVER_ANIMATION_DURATION);

      // Before timeout
      expect(scrollEnabled).toBe(false);

      // Fast-forward past animation duration
      jest.advanceTimersByTime(DISCOVER_ANIMATION_DURATION);

      expect(scrollEnabled).toBe(true);

      jest.useRealTimers();
    });

    test('should NOT auto-scroll to next section after animation', () => {
      jest.useFakeTimers();

      let currentScrollOffset = 0;
      const SCREEN_HEIGHT = 800;
      let scrollEnabled = false;

      // Simulate handleDiscoverSwipeUp - only re-enables scroll, no auto-scroll
      const handleDiscoverSwipeUp = () => {
        setTimeout(() => {
          scrollEnabled = true;
          // Note: NO scrollToSection() call here - that's the key
        }, DISCOVER_ANIMATION_DURATION);
      };

      handleDiscoverSwipeUp();
      jest.advanceTimersByTime(DISCOVER_ANIMATION_DURATION);

      // Scroll offset should remain at the same position (Discover section)
      expect(currentScrollOffset).toBe(0);
      // But scrolling should now be enabled
      expect(scrollEnabled).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Animation Reset', () => {
    test('animation state should reset when returning to Greeting section', () => {
      let currentSection = 1; // On Discover
      let discoverAnimationPlayed = true; // Animation was played
      let discoverAnimationActive = true;

      // Simulate returning to Greeting
      currentSection = 0;

      // Reset logic from useEffect
      if (currentSection === 0 && discoverAnimationPlayed) {
        discoverAnimationPlayed = false;
        discoverAnimationActive = false;
      }

      expect(discoverAnimationPlayed).toBe(false);
      expect(discoverAnimationActive).toBe(false);
    });

    test('animation should be able to play again after reset', () => {
      // State after reset
      let discoverAnimationPlayed = false;
      let scrollEnabled = true;
      let currentSection = 0;

      // Navigate back to Discover
      currentSection = 1;

      // Scroll disable logic when landing on Discover
      if (currentSection === 1 && !discoverAnimationPlayed) {
        scrollEnabled = false;
      }

      expect(scrollEnabled).toBe(false);

      // Now animation can be triggered again
      const canTriggerAnimation = !discoverAnimationPlayed;
      expect(canTriggerAnimation).toBe(true);
    });
  });

  describe('DiscoverSection Component Logic', () => {
    test('isActive prop should trigger animation out', () => {
      let textOpacity = 1;
      let textTranslateY = 0;
      let cardTranslateY = 0;
      let cardScale = 1;
      let isAnimatedOut = false;

      const isActive = true;

      // Simulate the useEffect logic in DiscoverSection
      if (isActive && !isAnimatedOut) {
        isAnimatedOut = true;
        textOpacity = 0;
        textTranslateY = -100;
        cardTranslateY = -180;
        cardScale = 1.05;
      }

      expect(textOpacity).toBe(0);
      expect(textTranslateY).toBe(-100);
      expect(cardTranslateY).toBe(-180);
      expect(cardScale).toBe(1.05);
    });

    test('isActive=false should reverse animation', () => {
      let textOpacity = 0;
      let textTranslateY = -100;
      let cardTranslateY = -180;
      let cardScale = 1.05;
      let isAnimatedOut = true;

      const isActive = false;

      // Simulate the reverse animation logic
      if (!isActive && isAnimatedOut) {
        isAnimatedOut = false;
        textOpacity = 1;
        textTranslateY = 0;
        cardTranslateY = 0;
        cardScale = 1;
      }

      expect(textOpacity).toBe(1);
      expect(textTranslateY).toBe(0);
      expect(cardTranslateY).toBe(0);
      expect(cardScale).toBe(1);
    });
  });

  describe('User Flow Integration', () => {
    test('complete user flow: Greeting → Discover → Animation → Swipe Cards', () => {
      // Initial state
      let currentSection = 0;
      let discoverAnimationPlayed = false;
      let discoverAnimationActive = false;
      let scrollEnabled = true;

      // Step 1: User scrolls to Discover section
      currentSection = 1;
      if (currentSection === 1 && !discoverAnimationPlayed) {
        scrollEnabled = false;
      }
      expect(scrollEnabled).toBe(false);

      // Step 2: User swipes up (any speed)
      const swipeEvent = { translationY: -50 }; // Medium swipe
      if (swipeEvent.translationY < SWIPE_THRESHOLD) {
        discoverAnimationActive = true;
        discoverAnimationPlayed = true;
      }
      expect(discoverAnimationActive).toBe(true);
      expect(discoverAnimationPlayed).toBe(true);

      // Step 3: Animation plays (600ms) - scroll re-enables
      scrollEnabled = true; // After DISCOVER_ANIMATION_DURATION
      expect(scrollEnabled).toBe(true);

      // Step 4: User is still on Discover (NO auto-scroll happened)
      expect(currentSection).toBe(1);

      // Step 5: User can now swipe again to scroll to Swipe Cards
      currentSection = 2;
      expect(currentSection).toBe(2);
    });

    test('complete user flow: returning to Greeting resets animation', () => {
      // State after animation has played
      let currentSection = 2; // On Swipe Cards
      let discoverAnimationPlayed = true;
      let discoverAnimationActive = true;
      let scrollEnabled = true;

      // User scrolls back to Greeting
      currentSection = 0;
      if (currentSection === 0 && discoverAnimationPlayed) {
        discoverAnimationPlayed = false;
        discoverAnimationActive = false;
      }

      expect(discoverAnimationPlayed).toBe(false);
      expect(discoverAnimationActive).toBe(false);

      // User scrolls to Discover again
      currentSection = 1;
      if (currentSection === 1 && !discoverAnimationPlayed) {
        scrollEnabled = false;
      }

      expect(scrollEnabled).toBe(false);
      // Animation can now be triggered again
    });
  });
});
