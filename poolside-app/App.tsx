import { useCallback, useState, useEffect, useRef } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
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

// Keep native splash screen visible while loading fonts
ExpoSplashScreen.preventAutoHideAsync();

// Main app content that switches between auth and main app
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Fade out splash screen after 1.5 seconds, then hide it
  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        // Fade out animation
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, splashOpacity]);

  if (!fontsLoaded) {
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
