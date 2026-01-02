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
    } catch (error) {
      // Token invalid or expired, clear it
      await tokenStorage.clearTokens();
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
    } catch (error) {
      // If refresh fails, log out
      await logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
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
