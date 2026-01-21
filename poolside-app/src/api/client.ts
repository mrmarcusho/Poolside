import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Configure base URL - change this for production
// Use your computer's IP address for testing on physical devices
const API_BASE_URL = __DEV__
  ? 'http://10.243.20.219:3000/v1'
  : 'https://api.poolside.app/v1';

// Base URL without the /v1 path (for uploads)
const API_SERVER_URL = __DEV__
  ? 'http://10.243.20.219:3000'
  : 'https://api.poolside.app';

// Helper to fix image URLs that may have old/wrong IP addresses
export const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Local file:// URLs are invalid (old cached paths) - return null to filter out
  if (url.startsWith('file://')) {
    console.warn('[fixImageUrl] Found local file URL (invalid):', url);
    return null;
  }

  // If it's already a valid external URL (not our server), return as-is
  if (url.startsWith('https://') && !url.includes('poolside.app')) {
    return url;
  }

  // Extract filename from URL (handles various formats)
  // e.g., "http://old-ip:3000/uploads/abc123.jpg" -> "abc123.jpg"
  const uploadsMatch = url.match(/\/uploads\/([^\/\?]+)/);
  if (uploadsMatch) {
    const filename = uploadsMatch[1];
    return `${API_SERVER_URL}/uploads/${filename}`;
  }

  // If it's just a filename, construct the full URL
  if (!url.includes('/') && !url.includes(':')) {
    return `${API_SERVER_URL}/uploads/${url}`;
  }

  // Return original if we can't parse it
  return url;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'poolside_access_token';
const REFRESH_TOKEN_KEY = 'poolside_refresh_token';

// Token management - uses SecureStore on native, localStorage on web
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Auth endpoints that should NOT trigger token refresh on 401
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-magic-link', '/auth/send-magic-link', '/auth/refresh'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest.url || '';

    // Skip token refresh for auth endpoints - they handle their own 401s
    const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => requestUrl.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await tokenStorage.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
