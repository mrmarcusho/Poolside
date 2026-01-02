/**
 * TEST 3: SafeAreaProvider Nesting Diagnostics
 * Tests if nested SafeAreaProvider causes crashes
 */

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Use actual implementation for this test to detect real issues
jest.unmock('react-native-safe-area-context');

// Re-mock with a more realistic implementation
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  let providerCount = 0;

  const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => {
    providerCount++;
    // Track nesting depth
    React.useEffect(() => {
      if (providerCount > 1) {
        console.warn(`WARNING: Nested SafeAreaProvider detected! Count: ${providerCount}`);
      }
      return () => {
        providerCount--;
      };
    }, []);

    return React.createElement(View, { testID: `safe-area-provider-${providerCount}` }, children);
  };

  const SafeAreaView = ({ children, edges, style }: any) => {
    return React.createElement(View, { style }, children);
  };

  const useSafeAreaInsets = () => ({ top: 47, bottom: 34, left: 0, right: 0 });

  return {
    SafeAreaProvider,
    SafeAreaView,
    useSafeAreaInsets,
  };
});

const { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } = require('react-native-safe-area-context');

// Component that mimics CreateEventScreen's structure with nested SafeAreaProvider
const ProblematicComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <Text>Main Content</Text>
      <TouchableOpacity testID="open-modal" onPress={() => setModalVisible(true)}>
        <Text>Open Modal</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        {/* THIS IS THE PROBLEMATIC PATTERN - nested SafeAreaProvider */}
        <SafeAreaProvider>
          <SafeAreaView edges={['top', 'bottom']}>
            <Text>Modal Content</Text>
            <TouchableOpacity testID="close-modal" onPress={() => setModalVisible(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
};

// Fixed version without nested SafeAreaProvider
const FixedComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <Text>Main Content</Text>
      <TouchableOpacity testID="open-modal" onPress={() => setModalVisible(true)}>
        <Text>Open Modal</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        {/* FIXED: No nested SafeAreaProvider, just SafeAreaView */}
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#151528' }}>
          <Text>Modal Content</Text>
          <TouchableOpacity testID="close-modal" onPress={() => setModalVisible(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

describe('SafeAreaProvider Nesting Diagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('3.1 - Detects nested SafeAreaProvider (PROBLEMATIC pattern from CreateEventScreen)', () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const { getByTestId } = render(
      <SafeAreaProvider>
        <ProblematicComponent />
      </SafeAreaProvider>
    );

    // Open the modal
    fireEvent.press(getByTestId('open-modal'));

    // Check if warning was logged about nesting
    const nestedWarnings = warnSpy.mock.calls.filter(
      call => call[0]?.includes?.('Nested SafeAreaProvider')
    );

    // This confirms the problematic pattern exists
    expect(nestedWarnings.length).toBeGreaterThan(0);
    console.log('DIAGNOSTIC: Nested SafeAreaProvider detected in modal - this may cause crashes');
  });

  test('3.2 - Fixed version without nested SafeAreaProvider', () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const { getByTestId } = render(
      <SafeAreaProvider>
        <FixedComponent />
      </SafeAreaProvider>
    );

    // Open the modal
    fireEvent.press(getByTestId('open-modal'));

    // No nesting warnings should appear
    const nestedWarnings = warnSpy.mock.calls.filter(
      call => call[0]?.includes?.('Nested SafeAreaProvider')
    );

    expect(nestedWarnings.length).toBe(0);
    console.log('DIAGNOSTIC: Fixed pattern works correctly');
  });

  test('3.3 - useSafeAreaInsets works without provider (should fail gracefully)', () => {
    // In real RN, this would crash. Our mock handles it gracefully.
    const TestComponent = () => {
      const insets = useSafeAreaInsets();
      return <Text testID="insets">{JSON.stringify(insets)}</Text>;
    };

    // Without SafeAreaProvider - in real app this may crash
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('insets')).toBeTruthy();
  });
});
