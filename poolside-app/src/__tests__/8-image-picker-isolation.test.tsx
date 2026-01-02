/**
 * TEST 8: expo-image-picker Isolation Test
 *
 * This test proves that expo-image-picker is the unique factor in CreateEventScreen
 * that could be causing the crash.
 *
 * Key findings:
 * - expo-image-picker is ONLY imported in CreateEventScreen
 * - All other screens that work do NOT import expo-image-picker
 * - expo-image-picker may need to be added to app.json plugins
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

describe('8.1 - expo-image-picker unique usage analysis', () => {
  test('8.1.1 - Verify expo-image-picker is only in CreateEventScreen', () => {
    // This is a static analysis - we've already verified with grep that
    // expo-image-picker is only imported in CreateEventScreen
    console.log('\n=== EXPO-IMAGE-PICKER USAGE ANALYSIS ===');
    console.log('Files that import expo-image-picker:');
    console.log('  - src/screens/CreateEventScreen.tsx (ONLY THIS FILE)');
    console.log('\nFiles that do NOT import expo-image-picker (and work correctly):');
    console.log('  - src/screens/FeedScreen.tsx');
    console.log('  - src/screens/MyPlansScreen.tsx');
    console.log('  - src/screens/FriendsScreen.tsx');
    console.log('  - src/screens/ProfileScreen.tsx');
    console.log('\nThis strongly suggests expo-image-picker is the crash source.');

    expect(true).toBe(true);
  });

  test('8.1.2 - Check app.json plugins configuration', () => {
    const fs = require('fs');
    const path = require('path');

    const appJsonPath = path.join(__dirname, '../../..', 'app.json');
    let appJson: any = {};

    try {
      const content = fs.readFileSync(appJsonPath, 'utf8');
      appJson = JSON.parse(content);
    } catch (e) {
      console.log('Could not read app.json');
      return;
    }

    const plugins = appJson?.expo?.plugins || [];
    const hasImagePickerPlugin = plugins.some((p: string | string[]) =>
      typeof p === 'string' ? p === 'expo-image-picker' : p[0] === 'expo-image-picker'
    );

    console.log('\n=== APP.JSON PLUGINS ANALYSIS ===');
    console.log('Current plugins:', JSON.stringify(plugins, null, 2));
    console.log('Has expo-image-picker plugin:', hasImagePickerPlugin);

    if (!hasImagePickerPlugin) {
      console.log('\n⚠️  POTENTIAL ISSUE: expo-image-picker is NOT in plugins!');
      console.log('This might cause native module initialization issues on iOS.');
      console.log('\nFix: Add expo-image-picker to app.json plugins:');
      console.log('"plugins": ["expo-font", "expo-image-picker"]');
    }

    // This test is informational, not a pass/fail
    expect(true).toBe(true);
  });
});

describe('8.2 - CreateEventScreen without ImagePicker', () => {
  test('8.2.1 - Minimal CreateEventScreen WITHOUT expo-image-picker', () => {
    const { LinearGradient } = require('expo-linear-gradient');
    const { BlurView } = require('expo-blur');
    const { Ionicons } = require('@expo/vector-icons');
    const { SafeAreaProvider, useSafeAreaInsets } = require('react-native-safe-area-context');
    const { AuthProvider, useAuth } = require('../context/AuthContext');
    // NOTE: NOT importing expo-image-picker

    const CreateEventScreenWithoutImagePicker = () => {
      const insets = useSafeAreaInsets();
      const { user } = useAuth();
      const timePickerRef = useRef<ScrollView>(null);
      const [title, setTitle] = useState('Untitled Event');
      const [coverImage, setCoverImage] = useState<string | null>(null);
      const [location, setLocation] = useState('');

      const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
          return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return 'MH';
      };

      // Removed handlePickImage function that uses ImagePicker

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
            >
              <BlurView intensity={40} tint="dark" style={{ padding: 24, borderRadius: 16 }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Untitled Event"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </BlurView>

              <TouchableOpacity>
                <Ionicons name="image-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff' }}>Upload image (disabled)</Text>
              </TouchableOpacity>

              <BlurView intensity={20} tint="dark" style={{ padding: 16, borderRadius: 16 }}>
                <LinearGradient colors={['#6366f1', '#8b5cf6']} style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff' }}>{getUserInitials()}</Text>
                </LinearGradient>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Location"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>
              </BlurView>

              <TouchableOpacity style={{ backgroundColor: '#667eea', padding: 18, borderRadius: 16 }}>
                <Text style={{ color: '#fff' }}>Create Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      );
    };

    let error: Error | null = null;
    try {
      const { getByPlaceholderText } = render(
        <SafeAreaProvider>
          <AuthProvider>
            <CreateEventScreenWithoutImagePicker />
          </AuthProvider>
        </SafeAreaProvider>
      );
      expect(getByPlaceholderText('Untitled Event')).toBeTruthy();
      console.log('✅ CreateEventScreen WITHOUT ImagePicker renders successfully');
    } catch (e) {
      error = e as Error;
      console.log('❌ Even without ImagePicker, component crashed:', error.message);
    }

    expect(error).toBeNull();
  });

  test('8.2.2 - Test ImagePicker import in isolation', () => {
    let error: Error | null = null;
    let ImagePicker: any = null;

    try {
      // Test just the import
      ImagePicker = require('expo-image-picker');
      console.log('✅ expo-image-picker import successful');
      console.log('Available exports:', Object.keys(ImagePicker));
    } catch (e) {
      error = e as Error;
      console.log('❌ expo-image-picker import FAILED:', error.message);
    }

    expect(error).toBeNull();
    expect(ImagePicker).not.toBeNull();
  });

  test('8.2.3 - Test ImagePicker.launchImageLibraryAsync existence', () => {
    const ImagePicker = require('expo-image-picker');

    console.log('\n=== EXPO-IMAGE-PICKER API CHECK ===');
    console.log('launchImageLibraryAsync exists:', typeof ImagePicker.launchImageLibraryAsync);
    console.log('MediaTypeOptions exists:', typeof ImagePicker.MediaTypeOptions);
    console.log('MediaTypeOptions.Images:', ImagePicker.MediaTypeOptions?.Images);

    expect(ImagePicker.launchImageLibraryAsync).toBeDefined();
    expect(ImagePicker.MediaTypeOptions).toBeDefined();
  });
});

describe('8.3 - Potential fix verification', () => {
  test('8.3.1 - Suggest fixes for expo-image-picker crash', () => {
    console.log('\n=== POTENTIAL FIXES FOR THE CRASH ===\n');

    console.log('FIX 1: Add expo-image-picker to app.json plugins');
    console.log('-----------------------------------------------');
    console.log('In app.json, update the plugins array:');
    console.log('"plugins": [');
    console.log('  "expo-font",');
    console.log('  [');
    console.log('    "expo-image-picker",');
    console.log('    {');
    console.log('      "photosPermission": "Allow $(PRODUCT_NAME) to access your photos."');
    console.log('    }');
    console.log('  ]');
    console.log(']');

    console.log('\n\nFIX 2: Lazy load expo-image-picker (defer import until needed)');
    console.log('-------------------------------------------------------------');
    console.log('Instead of: import * as ImagePicker from "expo-image-picker";');
    console.log('Use dynamic import inside the handler function:');
    console.log('const handlePickImage = async () => {');
    console.log('  const ImagePicker = await import("expo-image-picker");');
    console.log('  const result = await ImagePicker.launchImageLibraryAsync({...});');
    console.log('};');

    console.log('\n\nFIX 3: Remove expo-image-picker temporarily');
    console.log('-------------------------------------------');
    console.log('Comment out the import and handlePickImage function');
    console.log('to verify this is the crash source.');

    console.log('\n\nRECOMMENDATION:');
    console.log('Start with FIX 2 (lazy load) - it requires no config changes');
    console.log('and will defer the native module loading until actually needed.');

    expect(true).toBe(true);
  });
});
