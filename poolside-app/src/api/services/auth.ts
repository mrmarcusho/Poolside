import { apiClient, tokenStorage } from '../client';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  cabinNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emoji: string | null;
    avatar: string | null;
    cabinNumber: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MagicLinkSentResponse {
  message: string;
  expiresAt: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  // Magic Link Authentication
  async sendMagicLink(email: string): Promise<MagicLinkSentResponse> {
    const response = await apiClient.post<MagicLinkSentResponse>('/auth/send-magic-link', { email });
    return response.data;
  },

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-magic-link', { token });
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },
};
