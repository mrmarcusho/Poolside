import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Animated, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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

// Chillax font imports (local files)
const ChillaxRegular = require('./src/assets/fonts/Chillax-Regular.ttf');
const ChillaxMedium = require('./src/assets/fonts/Chillax-Medium.ttf');
const ChillaxSemibold = require('./src/assets/fonts/Chillax-Semibold.ttf');
const ChillaxBold = require('./src/assets/fonts/Chillax-Bold.ttf');

// Clash Display font imports (local files)
const ClashDisplayRegular = require('./src/assets/fonts/ClashDisplay-Regular.ttf');
const ClashDisplayMedium = require('./src/assets/fonts/ClashDisplay-Medium.ttf');
const ClashDisplaySemibold = require('./src/assets/fonts/ClashDisplay-Semibold.ttf');
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
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Epilogue_400Regular,
  Epilogue_500Medium,
  Epilogue_600SemiBold,
  Epilogue_700Bold,
  Epilogue_800ExtraBold,
} from '@expo-google-fonts/epilogue';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { CustomSplashScreen, WelcomeScreen, AuthScreen } from './src/screens';
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
  // Only show welcome/auth screens if user is NOT already authenticated
  // If they have valid tokens from a previous session, skip straight to main app
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // After initial auth check, decide whether to show welcome/auth or go to main app
  useEffect(() => {
    if (!isLoading && !initialCheckDone) {
      setInitialCheckDone(true);
      if (!isAuthenticated) {
        // User not logged in - show welcome flow
        setShowWelcome(true);
      }
      // If authenticated, showWelcome stays false and we go straight to main app
    }
  }, [isLoading, isAuthenticated, initialCheckDone]);

  // Debug logging for auth state
  useEffect(() => {
    console.log('[AppContent] Auth state changed:', { isAuthenticated, isLoading, showWelcome, showAuth });
  }, [isAuthenticated, isLoading, showWelcome, showAuth]);

  // Pre-fetch data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !dataPrefetched) {
      console.log('[AppContent] Starting data prefetch...');
      prefetchAppData().then(() => {
        console.log('[AppContent] Data prefetch complete');
        setDataPrefetched(true);
      });
    }
  }, [isAuthenticated, dataPrefetched]);

  // Reset state on logout - show auth screen again
  useEffect(() => {
    if (!isAuthenticated && initialCheckDone && !isLoading) {
      setDataPrefetched(false);
      // User logged out - show auth screen (skip welcome since they've seen it)
      setShowAuth(true);
    }
  }, [isAuthenticated, initialCheckDone, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // TESTING: Show welcome screen first for all users
  if (showWelcome) {
    return <WelcomeScreen onComplete={() => {
      setShowWelcome(false);
      setShowAuth(true);
    }} />;
  }

  // Show auth flow (email verification) after welcome
  if (showAuth) {
    return <AuthScreen onComplete={() => setShowAuth(false)} />;
  }

  // CRITICAL: Wait for authentication to be confirmed before rendering main app
  // This prevents the race condition where screens mount and make API calls
  // before tokens are stored and AuthContext is updated
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
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
    // Chillax fonts
    'Chillax-Regular': ChillaxRegular,
    'Chillax-Medium': ChillaxMedium,
    'Chillax-Semibold': ChillaxSemibold,
    'Chillax-Bold': ChillaxBold,
    // Clash Display fonts
    'ClashDisplay-Regular': ClashDisplayRegular,
    'ClashDisplay-Medium': ClashDisplayMedium,
    'ClashDisplay-Semibold': ClashDisplaySemibold,
    // Poppins fonts
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    // Epilogue fonts
    'Epilogue-Regular': Epilogue_400Regular,
    'Epilogue-Medium': Epilogue_500Medium,
    'Epilogue-SemiBold': Epilogue_600SemiBold,
    'Epilogue-Bold': Epilogue_700Bold,
    'Epilogue-ExtraBold': Epilogue_800ExtraBold,
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
      <KeyboardProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <View style={{ flex: 1 }}>
              <StatusBar style="light" />
              <AppContent />
            </View>
          </AuthProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
