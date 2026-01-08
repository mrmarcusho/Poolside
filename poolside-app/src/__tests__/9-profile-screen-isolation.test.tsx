/**
 * TEST 9: Isolation Tests for ProfileScreen Crash
 * Tests each component in isolation to find the exact crash source
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

// ============================================
// TEST GROUP 1: Component Import Tests
// ============================================

describe('9.1 - ProfileScreen Component Imports', () => {
  test('9.1.1 - BlobBackground import', () => {
    let error: Error | null = null;
    try {
      const { BlobBackground } = require('../components/BlobBackground');
      expect(BlobBackground).toBeDefined();
      console.log('✅ BlobBackground import successful');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: BlobBackground import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('9.1.2 - GlassOverlay import', () => {
    let error: Error | null = null;
    try {
      const { GlassOverlay } = require('../components/GlassOverlay');
      expect(GlassOverlay).toBeDefined();
      console.log('✅ GlassOverlay import successful');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: GlassOverlay import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('9.1.3 - DeckCarousel import', () => {
    let error: Error | null = null;
    try {
      const { DeckCarousel } = require('../components/DeckCarousel');
      expect(DeckCarousel).toBeDefined();
      console.log('✅ DeckCarousel import successful');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: DeckCarousel import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('9.1.4 - InterestsGallery import', () => {
    let error: Error | null = null;
    try {
      const { InterestsGallery } = require('../components/InterestsGallery');
      expect(InterestsGallery).toBeDefined();
      console.log('✅ InterestsGallery import successful');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: InterestsGallery import failed:', error.message);
    }
    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 2: Component Render Tests
// ============================================

describe('9.2 - ProfileScreen Component Renders', () => {
  beforeAll(() => {
    // Mock navigation
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({ goBack: jest.fn() }),
    }));

    // Mock users service
    jest.mock('../api/services/users', () => ({
      usersService: {
        getMe: jest.fn().mockResolvedValue({
          id: '1',
          name: 'Test User',
          bio: 'Test bio',
          avatar: null,
        }),
      },
    }));
  });

  test('9.2.1 - BlobBackground render', () => {
    let error: Error | null = null;
    try {
      const { BlobBackground } = require('../components/BlobBackground');
      render(<BlobBackground />);
      console.log('✅ BlobBackground rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: BlobBackground render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });

  test('9.2.2 - GlassOverlay render', () => {
    let error: Error | null = null;
    try {
      const { GlassOverlay } = require('../components/GlassOverlay');
      render(<GlassOverlay />);
      console.log('✅ GlassOverlay rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: GlassOverlay render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });

  test('9.2.3 - DeckCarousel render with photos', () => {
    let error: Error | null = null;
    try {
      const { GestureHandlerRootView } = require('react-native-gesture-handler');
      const { DeckCarousel } = require('../components/DeckCarousel');

      const testPhotos = [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ];

      render(
        <GestureHandlerRootView style={{ flex: 1 }}>
          <DeckCarousel photos={testPhotos} />
        </GestureHandlerRootView>
      );
      console.log('✅ DeckCarousel rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: DeckCarousel render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });

  test('9.2.4 - InterestsGallery render with interests', () => {
    let error: Error | null = null;
    try {
      const { InterestsGallery } = require('../components/InterestsGallery');

      const testInterests = [
        {
          type: 'movie',
          title: 'Test Movie',
          year: '2024',
          image: 'https://example.com/movie.jpg',
        },
      ];

      render(<InterestsGallery interests={testInterests} />);
      console.log('✅ InterestsGallery rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: InterestsGallery render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });

  test('9.2.5 - InterestsGallery with song (has Waveform component)', () => {
    let error: Error | null = null;
    try {
      const { InterestsGallery } = require('../components/InterestsGallery');

      // This specifically tests the Waveform component which has hooks in map
      const testInterests = [
        {
          type: 'song',
          title: 'Test Song',
          artist: 'Test Artist',
          image: 'https://example.com/song.jpg',
        },
      ];

      render(<InterestsGallery interests={testInterests} />);
      console.log('✅ InterestsGallery with song rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: InterestsGallery with song render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 3: Combined Component Tests
// ============================================

describe('9.3 - Combined ProfileScreen Structure', () => {
  test('9.3.1 - BlobBackground + GlassOverlay together', () => {
    let error: Error | null = null;
    try {
      const { BlobBackground } = require('../components/BlobBackground');
      const { GlassOverlay } = require('../components/GlassOverlay');

      const TestComponent = () => (
        <View style={{ flex: 1, backgroundColor: '#050508' }}>
          <BlobBackground />
          <GlassOverlay />
          <Text style={{ color: '#fff', zIndex: 10 }}>Content</Text>
        </View>
      );

      render(<TestComponent />);
      console.log('✅ BlobBackground + GlassOverlay rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: BlobBackground + GlassOverlay failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('9.3.2 - Full ProfileScreen structure without InterestsGallery', () => {
    let error: Error | null = null;
    try {
      const { GestureHandlerRootView } = require('react-native-gesture-handler');
      const { BlobBackground } = require('../components/BlobBackground');
      const { GlassOverlay } = require('../components/GlassOverlay');
      const { DeckCarousel } = require('../components/DeckCarousel');

      const testPhotos = [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ];

      const TestComponent = () => (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: '#050508' }}>
            <BlobBackground />
            <GlassOverlay />
            <DeckCarousel photos={testPhotos} />
            <Text style={{ color: '#fff', zIndex: 10 }}>Profile Content</Text>
          </View>
        </GestureHandlerRootView>
      );

      render(<TestComponent />);
      console.log('✅ ProfileScreen structure (without InterestsGallery) rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: ProfileScreen structure failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });

  test('9.3.3 - Full ProfileScreen structure WITH InterestsGallery', () => {
    let error: Error | null = null;
    try {
      const { GestureHandlerRootView } = require('react-native-gesture-handler');
      const { BlobBackground } = require('../components/BlobBackground');
      const { GlassOverlay } = require('../components/GlassOverlay');
      const { DeckCarousel } = require('../components/DeckCarousel');
      const { InterestsGallery } = require('../components/InterestsGallery');

      const testPhotos = [
        'https://example.com/photo1.jpg',
      ];

      const testInterests = [
        { type: 'movie', title: 'Dune', year: '2024', image: 'https://example.com/dune.jpg' },
        { type: 'song', title: 'Pink + White', artist: 'Frank Ocean', image: 'https://example.com/song.jpg' },
        { type: 'sport', name: 'Tennis', level: 'competitive', emoji: '🎾' },
      ];

      const TestComponent = () => (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: '#050508' }}>
            <BlobBackground />
            <GlassOverlay />
            <DeckCarousel photos={testPhotos} />
            <InterestsGallery interests={testInterests} />
          </View>
        </GestureHandlerRootView>
      );

      render(<TestComponent />);
      console.log('✅ Full ProfileScreen structure rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: Full ProfileScreen structure failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 500));
    }
    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 4: Actual ProfileScreen Import
// ============================================

describe('9.4 - Actual ProfileScreen Tests', () => {
  test('9.4.1 - ProfileScreen dynamic import', async () => {
    let error: Error | null = null;
    try {
      const module = await import('../screens/ProfileScreen');
      expect(module.ProfileScreen).toBeDefined();
      console.log('✅ ProfileScreen import successful');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: ProfileScreen import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('9.4.2 - ProfileScreen render', async () => {
    let error: Error | null = null;
    try {
      const { GestureHandlerRootView } = require('react-native-gesture-handler');
      const { NavigationContainer } = require('@react-navigation/native');
      const { ProfileScreen } = require('../screens/ProfileScreen');

      render(
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <ProfileScreen />
          </NavigationContainer>
        </GestureHandlerRootView>
      );
      console.log('✅ ProfileScreen rendered successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ CRASH: ProfileScreen render failed:', error.message);
      console.log('Stack:', error.stack?.slice(0, 800));
    }
    expect(error).toBeNull();
  });
});
