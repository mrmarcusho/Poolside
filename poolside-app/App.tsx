import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Animated, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Asset } from 'expo-asset';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';

// Satoshi font imports (local files)
const SatoshiLight = require('./src/assets/fonts/Satoshi-Light.ttf');
const SatoshiRegular = require('./src/assets/fonts/Satoshi-Regular.ttf');
const SatoshiMedium = require('./src/assets/fonts/Satoshi-Medium.ttf');
const SatoshiBold = require('./src/assets/fonts/Satoshi-Bold.ttf');
const SatoshiBlack = require('./src/assets/fonts/Satoshi-Black.ttf');
import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import { Outfit_400Regular, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { Syne_700Bold } from '@expo-google-fonts/syne';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { CustomSplashScreen } from './src/screens';
import { RsvpProvider } from './src/context/RsvpContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EventCreationAnimationProvider } from './src/context/EventCreationAnimationContext';
import { EventCreationOverlay } from './src/components/EventCreationOverlay';
import { usersService } from './src/api/services/users';
import { messagesService } from './src/api/services/messages';
import { rsvpService } from './src/api/services/rsvp';

// Keep native splash screen visible while loading fonts and assets
ExpoSplashScreen.preventAutoHideAsync();

// Assets to preload for instant display
const preloadAssets = async () => {
  const imageAssets = [
    require('./src/assets/images/Starynight.png'),
    require('./src/assets/images/profile-background.png'),
    require('./src/assets/images/feed-background.png'),
    require('./assets/poolside-logo.png'),
    require('./assets/myplans-icon.png'),
    require('./assets/home-icon.png'),
    require('./assets/calendar-icon.png'),
    require('./assets/create-icon.png'),
    require('./assets/friends-icon.png'),
    require('./assets/profile-icon.png'),
  ];

  const videoAssets = [
    require('./src/assets/videos/PoolsideAnimation.mp4'),
  ];

  // Preload images
  const imagePromises = imageAssets.map((image) => {
    return Asset.fromModule(image).downloadAsync();
  });

  // Preload videos
  const videoPromises = videoAssets.map((video) => {
    return Asset.fromModule(video).downloadAsync();
  });

  await Promise.all([...imagePromises, ...videoPromises]);
};

// Pre-fetch data for instant screen transitions (excludes feed events)
const prefetchAppData = async () => {
  try {
    // Fetch in parallel: user profile, conversations, RSVPs
    await Promise.all([
      usersService.getMe(),
      messagesService.getConversations(),
      rsvpService.getMyRsvps(),
    ]);
    console.log('[App] Pre-fetched user data, conversations, and RSVPs');
  } catch (error) {
    console.warn('[App] Failed to pre-fetch some data:', error);
    // Continue anyway - screens will fetch on mount if needed
  }
};

// Main app content that switches between auth and main app
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [dataPrefetched, setDataPrefetched] = useState(false);

  // Pre-fetch data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !dataPrefetched) {
      prefetchAppData().then(() => setDataPrefetched(true));
    }
  }, [isAuthenticated, dataPrefetched]);

  // Reset prefetch flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setDataPrefetched(false);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <RsvpProvider>
      <EventCreationAnimationProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <MainNavigator />
          <EventCreationOverlay />
        </NavigationContainer>
      </EventCreationAnimationProvider>
    </RsvpProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    PlayfairDisplay_700Bold,
    DancingScript_700Bold,
    SpaceMono_700Bold,
    Pacifico_400Regular,
    Oswald_600SemiBold,
    Lobster_400Regular,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Syne_700Bold,
    // Satoshi fonts
    'Satoshi-Light': SatoshiLight,
    'Satoshi-Regular': SatoshiRegular,
    'Satoshi-Medium': SatoshiMedium,
    'Satoshi-Bold': SatoshiBold,
    'Satoshi-Black': SatoshiBlack,
  });

  const [showSplash, setShowSplash] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Preload assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        await preloadAssets();
        setAssetsLoaded(true);
      } catch (error) {
        console.warn('Failed to preload some assets:', error);
        setAssetsLoaded(true); // Continue anyway
      }
    };
    loadAssets();
  }, []);

  const isReady = fontsLoaded && assetsLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [isReady]);

  // Fade out splash screen after fonts and assets are loaded
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        // Fade out animation
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 500); // Reduced delay since we're waiting for assets
      return () => clearTimeout(timer);
    }
  }, [isReady, splashOpacity]);

  if (!isReady) {
    return null;
  }

  // Show custom splash screen with fade animation
  if (showSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            <CustomSplashScreen opacity={splashOpacity} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <AppContent />
          </View>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
