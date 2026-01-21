import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, usersService, tokenStorage, CurrentUser, RegisterData, LoginData } from '../api';

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthUser: (user: CurrentUser) => void;  // Direct user setter for magic link auth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        const userData = await usersService.getMe();
        setUser(userData);
      }
    } catch (error: any) {
      // Only clear tokens on explicit 401 (unauthorized) response
      // Don't clear on network errors or other transient failures
      if (error?.response?.status === 401) {
        console.log('[AuthContext] Token invalid (401), clearing tokens');
        await tokenStorage.clearTokens();
      } else {
        console.log('[AuthContext] checkAuthState error (not clearing tokens):', error?.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data);
    setUser(response.user as CurrentUser);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user as CurrentUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await usersService.getMe();
      setUser(userData);
    } catch (error: any) {
      // Only log out on explicit 401 (token truly invalid)
      // Don't log out on network errors or transient failures
      if (error?.response?.status === 401) {
        console.log('[AuthContext] refreshUser got 401, logging out');
        await logout();
      } else {
        console.log('[AuthContext] refreshUser error (not logging out):', error?.message);
      }
    }
  }, [logout]);

  // Direct user setter - use when you already have user data (e.g., from verifyMagicLink)
  const setAuthUser = useCallback((userData: CurrentUser) => {
    console.log('[AuthContext] setAuthUser called for:', userData.email);
    setUser(userData);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    setAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
