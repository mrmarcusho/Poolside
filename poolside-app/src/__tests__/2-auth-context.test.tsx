/**
 * TEST 2: AuthContext Hook Diagnostics
 * Tests if useAuth() hook is called correctly within AuthProvider
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

// Mock the API modules before importing AuthContext
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

import { AuthProvider, useAuth } from '../context/AuthContext';

// Test component that uses useAuth
const TestAuthConsumer = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  return (
    <View>
      <Text testID="loading">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="authenticated">{isAuthenticated ? 'yes' : 'no'}</Text>
      <Text testID="user">{user ? user.firstName : 'none'}</Text>
    </View>
  );
};

describe('AuthContext Diagnostics', () => {
  test('2.1 - useAuth throws when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestAuthConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });

  test('2.2 - useAuth works inside AuthProvider', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    // Should render without throwing
    expect(getByTestId('loading')).toBeTruthy();
  });

  test('2.3 - AuthProvider provides correct initial state', async () => {
    const { getByTestId, findByText } = render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    // Wait for loading to complete
    await findByText('ready');

    expect(getByTestId('authenticated').props.children).toBe('no');
    expect(getByTestId('user').props.children).toBe('none');
  });
});
