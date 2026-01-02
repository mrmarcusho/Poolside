/**
 * TEST 5: CreateEventScreen Component Diagnostics
 * Tests the actual component rendering to find the crash source
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock all external dependencies
jest.mock('../api/services/events', () => ({
  eventsService: {
    createEvent: jest.fn().mockResolvedValue({ id: '1', title: 'Test' }),
    getEvents: jest.fn().mockResolvedValue({ events: [], hasMore: false, total: 0 }),
  },
}));

jest.mock('../api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  usersService: {
    getMe: jest.fn(),
  },
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

import { AuthProvider } from '../context/AuthContext';
import { CreateEventScreen } from '../screens/CreateEventScreen';

// Wrapper with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const { SafeAreaProvider } = require('react-native-safe-area-context');
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SafeAreaProvider>
  );
};

describe('CreateEventScreen Diagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('5.1 - CreateEventScreen can be imported without errors', () => {
    expect(CreateEventScreen).toBeDefined();
    expect(typeof CreateEventScreen).toBe('function');
  });

  test('5.2 - CreateEventScreen renders without crashing when wrapped properly', async () => {
    let error: Error | null = null;

    try {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <CreateEventScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Untitled Event')).toBeTruthy();
      });
    } catch (e) {
      error = e as Error;
      console.error('CRASH DETECTED:', e);
    }

    if (error) {
      console.log('\n=== CRASH ANALYSIS ===');
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);

      // Analyze the error
      if (error.message.includes('useAuth')) {
        console.log('ROOT CAUSE: useAuth hook called outside AuthProvider');
      } else if (error.message.includes('SafeArea')) {
        console.log('ROOT CAUSE: SafeArea-related issue');
      } else if (error.message.includes('Cannot read') || error.message.includes('undefined')) {
        console.log('ROOT CAUSE: Null/undefined access - check dependencies');
      }
    }

    expect(error).toBeNull();
  });

  test('5.3 - CreateEventScreen crashes without AuthProvider', () => {
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(
        <SafeAreaProvider>
          <CreateEventScreen />
        </SafeAreaProvider>
      );
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
    console.log('CONFIRMED: CreateEventScreen requires AuthProvider');
  });

  test('5.4 - CreateEventScreen crashes without SafeAreaProvider', async () => {
    // This test checks if useSafeAreaInsets causes issues
    // In our mock, it should work, but in real app it might crash
    const originalError = console.error;
    console.error = jest.fn();

    let crashed = false;
    try {
      render(
        <AuthProvider>
          <CreateEventScreen />
        </AuthProvider>
      );
    } catch (e) {
      crashed = true;
      console.log('CONFIRMED: CreateEventScreen requires SafeAreaProvider');
      console.log('Error:', (e as Error).message);
    }

    console.error = originalError;

    // Log result
    if (!crashed) {
      console.log('SafeAreaProvider mock handled missing provider gracefully');
    }
  });
});
