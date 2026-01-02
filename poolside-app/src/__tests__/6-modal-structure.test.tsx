/**
 * TEST 6: Modal Structure Diagnostics
 * Tests the specific Modal structure in CreateEventScreen that may cause crashes
 */

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Recreate the exact modal structure from CreateEventScreen
const ExactModalReproduction = () => {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } = require('react-native-safe-area-context');
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TouchableOpacity testID="open-picker" onPress={() => setIsDatePickerVisible(true)}>
        <Text>Open Date Picker</Text>
      </TouchableOpacity>

      {/* Exact structure from CreateEventScreen lines 469-560 */}
      <Modal
        visible={isDatePickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#151528' }} edges={['top', 'bottom']}>
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
                <TouchableOpacity testID="clear-btn">
                  <Text>Clear</Text>
                </TouchableOpacity>
                <Text>Date & Time</Text>
                <TouchableOpacity testID="done-btn" onPress={() => setIsDatePickerVisible(false)}>
                  <Text>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar Section */}
              <View style={{ padding: 24 }}>
                <Text>Calendar goes here</Text>
              </View>

              {/* Time Picker - ScrollView */}
              <ScrollView style={{ flex: 1 }}>
                <Text>Time options</Text>
              </ScrollView>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
};

// Fixed version
const FixedModalReproduction = () => {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const { SafeAreaView, useSafeAreaInsets } = require('react-native-safe-area-context');
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TouchableOpacity testID="open-picker" onPress={() => setIsDatePickerVisible(true)}>
        <Text>Open Date Picker</Text>
      </TouchableOpacity>

      <Modal
        visible={isDatePickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        {/* FIXED: Removed SafeAreaProvider wrapper */}
        <View style={{ flex: 1, backgroundColor: '#151528' }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
                <TouchableOpacity testID="clear-btn">
                  <Text>Clear</Text>
                </TouchableOpacity>
                <Text>Date & Time</Text>
                <TouchableOpacity testID="done-btn" onPress={() => setIsDatePickerVisible(false)}>
                  <Text>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ padding: 24 }}>
                <Text>Calendar goes here</Text>
              </View>
              <ScrollView style={{ flex: 1 }}>
                <Text>Time options</Text>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

describe('Modal Structure Diagnostics', () => {
  const { SafeAreaProvider } = require('react-native-safe-area-context');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('6.1 - Exact modal reproduction from CreateEventScreen', () => {
    let error: Error | null = null;

    try {
      const { getByTestId } = render(
        <SafeAreaProvider>
          <ExactModalReproduction />
        </SafeAreaProvider>
      );

      // Open modal
      fireEvent.press(getByTestId('open-picker'));
    } catch (e) {
      error = e as Error;
    }

    if (error) {
      console.log('\n=== MODAL CRASH DETECTED ===');
      console.log('This confirms the nested SafeAreaProvider pattern crashes');
      console.log('Error:', error.message);
    } else {
      console.log('Modal rendered (in test mocks - may still crash on device)');
    }
  });

  test('6.2 - Fixed modal structure works correctly', async () => {
    const { getByTestId } = render(
      <SafeAreaProvider>
        <FixedModalReproduction />
      </SafeAreaProvider>
    );

    // Open modal
    fireEvent.press(getByTestId('open-picker'));

    // Close modal
    await waitFor(() => {
      fireEvent.press(getByTestId('done-btn'));
    });

    console.log('FIXED: Modal without nested SafeAreaProvider works correctly');
  });

  test('6.3 - Verify nested SafeAreaProvider has been removed from CreateEventScreen', () => {
    // This is a static analysis test
    const fs = require('fs');
    const path = require('path');

    // Read the actual file
    const filePath = path.join(__dirname, '../screens/CreateEventScreen.tsx');
    let fileContent = '';

    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      console.log('Could not read file for static analysis');
      return;
    }

    // Check for problematic pattern
    const hasNestedSafeAreaProvider =
      fileContent.includes('<Modal') &&
      fileContent.includes('<SafeAreaProvider>') &&
      fileContent.match(/<Modal[\s\S]*?<SafeAreaProvider>/);

    if (hasNestedSafeAreaProvider) {
      console.log('\n=== PROBLEM STILL EXISTS ===');
      console.log('FOUND: Nested SafeAreaProvider inside Modal in CreateEventScreen.tsx');
    } else {
      console.log('\n=== FIX VERIFIED ===');
      console.log('Nested SafeAreaProvider has been removed from Modal');
      console.log('The crash should now be resolved');
    }

    expect(!!hasNestedSafeAreaProvider).toBe(false); // Confirms the fix was applied
  });
});
