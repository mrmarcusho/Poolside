/**
 * TEST 1: Import Diagnostics
 * Tests if all imports in CreateEventScreen can be resolved without errors
 */

describe('Import Diagnostics', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('1.1 - React and React Native imports', () => {
    expect(() => {
      require('react');
      require('react-native');
    }).not.toThrow();
  });

  test('1.2 - react-native-safe-area-context imports', () => {
    expect(() => {
      const module = require('react-native-safe-area-context');
      expect(module.SafeAreaView).toBeDefined();
      expect(module.SafeAreaProvider).toBeDefined();
      expect(module.useSafeAreaInsets).toBeDefined();
    }).not.toThrow();
  });

  test('1.3 - expo-linear-gradient import', () => {
    expect(() => {
      const module = require('expo-linear-gradient');
      expect(module.LinearGradient).toBeDefined();
    }).not.toThrow();
  });

  test('1.4 - expo-blur import', () => {
    expect(() => {
      const module = require('expo-blur');
      expect(module.BlurView).toBeDefined();
    }).not.toThrow();
  });

  test('1.5 - expo-image-picker import', () => {
    expect(() => {
      const module = require('expo-image-picker');
      expect(module.launchImageLibraryAsync).toBeDefined();
    }).not.toThrow();
  });

  test('1.6 - @expo/vector-icons import', () => {
    expect(() => {
      const module = require('@expo/vector-icons');
      expect(module.Ionicons).toBeDefined();
    }).not.toThrow();
  });

  test('1.7 - API services import', () => {
    expect(() => {
      require('../api/services/events');
    }).not.toThrow();
  });

  test('1.8 - AuthContext import', () => {
    expect(() => {
      require('../context/AuthContext');
    }).not.toThrow();
  });

  test('1.9 - CreateEventScreen import', () => {
    expect(() => {
      require('../screens/CreateEventScreen');
    }).not.toThrow();
  });
});
