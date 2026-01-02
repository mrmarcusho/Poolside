/**
 * TEST 7: Isolation Tests for CreateEventScreen Crash
 * Tests each component/import in isolation to find the exact crash source
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ============================================
// TEST GROUP 1: Import-level tests
// ============================================

describe('7.1 - Import-level isolation tests', () => {
  test('7.1.1 - expo-image-picker import', () => {
    let error: Error | null = null;
    try {
      const ImagePicker = require('expo-image-picker');
      expect(ImagePicker).toBeDefined();
    } catch (e) {
      error = e as Error;
      console.log('CRASH: expo-image-picker import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.1.2 - expo-blur BlurView import', () => {
    let error: Error | null = null;
    try {
      const { BlurView } = require('expo-blur');
      expect(BlurView).toBeDefined();
    } catch (e) {
      error = e as Error;
      console.log('CRASH: expo-blur import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.1.3 - expo-linear-gradient import', () => {
    let error: Error | null = null;
    try {
      const { LinearGradient } = require('expo-linear-gradient');
      expect(LinearGradient).toBeDefined();
    } catch (e) {
      error = e as Error;
      console.log('CRASH: expo-linear-gradient import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.1.4 - @expo/vector-icons Ionicons import', () => {
    let error: Error | null = null;
    try {
      const { Ionicons } = require('@expo/vector-icons');
      expect(Ionicons).toBeDefined();
    } catch (e) {
      error = e as Error;
      console.log('CRASH: @expo/vector-icons import failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.1.5 - eventsService import', () => {
    let error: Error | null = null;
    try {
      const { eventsService } = require('../api/services/events');
      expect(eventsService).toBeDefined();
      expect(eventsService.createEvent).toBeDefined();
    } catch (e) {
      error = e as Error;
      console.log('CRASH: eventsService import failed:', error.message);
    }
    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 2: Component-level tests
// ============================================

describe('7.2 - Component isolation tests', () => {
  // Mock all required modules
  beforeAll(() => {
    jest.mock('../api/services/events', () => ({
      eventsService: {
        createEvent: jest.fn().mockResolvedValue({ id: '1', title: 'Test' }),
      },
    }));

    jest.mock('../api', () => ({
      authService: { login: jest.fn(), register: jest.fn(), logout: jest.fn() },
      usersService: { getMe: jest.fn() },
      tokenStorage: {
        getAccessToken: jest.fn().mockResolvedValue(null),
        getRefreshToken: jest.fn().mockResolvedValue(null),
        setTokens: jest.fn(),
        clearTokens: jest.fn(),
      },
    }));
  });

  test('7.2.1 - BlurView with TextInput (titleCard pattern)', () => {
    const { BlurView } = require('expo-blur');

    const TestComponent = () => (
      <BlurView intensity={40} tint="dark" style={{ padding: 24 }}>
        <TextInput
          value="Test"
          placeholder="Test"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          textAlign="center"
        />
      </BlurView>
    );

    let error: Error | null = null;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e as Error;
      console.log('CRASH: BlurView with TextInput failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.2 - LinearGradient usage', () => {
    const { LinearGradient } = require('expo-linear-gradient');

    const TestComponent = () => (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#1a1a3e', '#0d0d2b']}
          style={StyleSheet.absoluteFill}
        />
        <Text>Content</Text>
      </View>
    );

    let error: Error | null = null;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e as Error;
      console.log('CRASH: LinearGradient failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.3 - useSafeAreaInsets in component', () => {
    const { useSafeAreaInsets } = require('react-native-safe-area-context');
    const { SafeAreaProvider } = require('react-native-safe-area-context');

    const TestComponent = () => {
      const insets = useSafeAreaInsets();
      return (
        <View style={{ paddingTop: insets.top }}>
          <Text>Content</Text>
        </View>
      );
    };

    let error: Error | null = null;
    try {
      render(
        <SafeAreaProvider>
          <TestComponent />
        </SafeAreaProvider>
      );
    } catch (e) {
      error = e as Error;
      console.log('CRASH: useSafeAreaInsets failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.4 - useAuth in component', () => {
    const { AuthProvider, useAuth } = require('../context/AuthContext');

    const TestComponent = () => {
      const { user } = useAuth();
      return <Text>{user?.firstName || 'No user'}</Text>;
    };

    let error: Error | null = null;
    try {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    } catch (e) {
      error = e as Error;
      console.log('CRASH: useAuth in component failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.5 - Ionicons usage', () => {
    const { Ionicons } = require('@expo/vector-icons');

    const TestComponent = () => (
      <View>
        <Ionicons name="image-outline" size={18} color="#fff" />
        <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
        <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.5)" />
        <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.5)" />
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
      </View>
    );

    let error: Error | null = null;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e as Error;
      console.log('CRASH: Ionicons usage failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.6 - KeyboardAvoidingView with ScrollView', () => {
    const TestComponent = () => (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text>Content</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );

    let error: Error | null = null;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e as Error;
      console.log('CRASH: KeyboardAvoidingView failed:', error.message);
    }
    expect(error).toBeNull();
  });

  test('7.2.7 - useRef with ScrollView', () => {
    const TestComponent = () => {
      const scrollRef = useRef<ScrollView>(null);

      return (
        <ScrollView ref={scrollRef} style={{ flex: 1 }}>
          <Text>Content</Text>
        </ScrollView>
      );
    };

    let error: Error | null = null;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e as Error;
      console.log('CRASH: useRef with ScrollView failed:', error.message);
    }
    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 3: Combined component tests
// ============================================

describe('7.3 - Combined pattern tests (mimicking CreateEventScreen structure)', () => {
  test('7.3.1 - Full minimal CreateEventScreen structure', () => {
    const { LinearGradient } = require('expo-linear-gradient');
    const { BlurView } = require('expo-blur');
    const { Ionicons } = require('@expo/vector-icons');
    const { SafeAreaProvider, useSafeAreaInsets } = require('react-native-safe-area-context');
    const { AuthProvider, useAuth } = require('../context/AuthContext');

    const MinimalCreateEventScreen = () => {
      const insets = useSafeAreaInsets();
      const { user } = useAuth();
      const timePickerRef = useRef<ScrollView>(null);

      const [title, setTitle] = useState('Untitled Event');
      const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

      const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
          return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return 'MH';
      };

      return (
        <View style={{ flex: 1, backgroundColor: '#0d0d2b' }}>
          <LinearGradient
            colors={['#1a1a3e', '#0d0d2b']}
            style={StyleSheet.absoluteFill}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingTop: insets.top + 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Card with BlurView */}
              <BlurView intensity={40} tint="dark" style={{ borderRadius: 16, padding: 24 }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Untitled Event"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  textAlign="center"
                />
              </BlurView>

              {/* Upload Button with Ionicons */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="image-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff' }}>Upload image</Text>
              </TouchableOpacity>

              {/* Date Selector */}
              <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
                <Text style={{ color: '#fff' }}>Set a date...</Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              {/* Form Section with BlurView */}
              <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LinearGradient colors={['#6366f1', '#8b5cf6']} style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff' }}>{getUserInitials()}</Text>
                  </LinearGradient>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    placeholder="Location"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>
              </BlurView>

              {/* Create Button */}
              <TouchableOpacity style={{ backgroundColor: '#667eea', padding: 18, borderRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Create Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Date Picker Modal */}
          <Modal
            visible={isDatePickerVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setIsDatePickerVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: '#151528', paddingTop: insets.top, paddingBottom: insets.bottom }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
                <TouchableOpacity>
                  <Text style={{ color: '#fff' }}>Clear</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff' }}>Date & Time</Text>
                <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                  <Text style={{ color: '#fff' }}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={timePickerRef}
                style={{ flex: 1 }}
              >
                <Text style={{ color: '#fff' }}>Time options here</Text>
              </ScrollView>
            </View>
          </Modal>
        </View>
      );
    };

    let error: Error | null = null;
    try {
      const { getByPlaceholderText } = render(
        <SafeAreaProvider>
          <AuthProvider>
            <MinimalCreateEventScreen />
          </AuthProvider>
        </SafeAreaProvider>
      );

      expect(getByPlaceholderText('Untitled Event')).toBeTruthy();
    } catch (e) {
      error = e as Error;
      console.log('\n=== CRASH IN MINIMAL REPRODUCTION ===');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }

    expect(error).toBeNull();
  });

  test('7.3.2 - Import actual CreateEventScreen and render', async () => {
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    const { AuthProvider } = require('../context/AuthContext');
    const { CreateEventScreen } = require('../screens/CreateEventScreen');

    let error: Error | null = null;
    try {
      const { getByPlaceholderText } = render(
        <SafeAreaProvider>
          <AuthProvider>
            <CreateEventScreen />
          </AuthProvider>
        </SafeAreaProvider>
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Untitled Event')).toBeTruthy();
      });

      console.log('SUCCESS: CreateEventScreen rendered without crash');
    } catch (e) {
      error = e as Error;
      console.log('\n=== CRASH IN ACTUAL CREATEEVENTSCREEN ===');
      console.log('Error:', error.message);
      console.log('\nThis is the actual crash that needs to be fixed!');

      // Analyze error message
      if (error.message.includes('useAuth')) {
        console.log('CAUSE: AuthContext issue');
      } else if (error.message.includes('SafeArea')) {
        console.log('CAUSE: SafeAreaContext issue');
      } else if (error.message.includes('BlurView')) {
        console.log('CAUSE: expo-blur issue');
      } else if (error.message.includes('undefined') || error.message.includes('null')) {
        console.log('CAUSE: Null/undefined access - check for missing data');
      } else if (error.message.includes('Image')) {
        console.log('CAUSE: Image/ImagePicker issue');
      }
    }

    expect(error).toBeNull();
  });
});

// ============================================
// TEST GROUP 4: Lazy loading simulation
// ============================================

describe('7.4 - Lazy loading simulation', () => {
  test('7.4.1 - Dynamic import of CreateEventScreen', async () => {
    let error: Error | null = null;

    try {
      // Simulate lazy loading
      const module = await import('../screens/CreateEventScreen');
      expect(module.CreateEventScreen).toBeDefined();
      console.log('Dynamic import successful');
    } catch (e) {
      error = e as Error;
      console.log('\n=== CRASH DURING DYNAMIC IMPORT ===');
      console.log('Error:', error.message);
      console.log('This means the crash happens at IMPORT TIME, not render time');
    }

    expect(error).toBeNull();
  });
});
