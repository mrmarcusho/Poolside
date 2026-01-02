import { apiClient } from '../client';

export interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    emoji: string | null;
    avatar: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    text: string;
    sentAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  sentAt: string;
  readAt: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export const messagesService = {
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const response = await apiClient.get('/me/messages/conversations');
    return response.data;
  },

  async getMessages(
    conversationId: string,
    limit?: number,
    before?: string
  ): Promise<MessagesResponse> {
    const response = await apiClient.get(`/me/messages/conversations/${conversationId}`, {
      params: { limit, before },
    });
    return response.data;
  },

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const response = await apiClient.post(`/me/messages/conversations/${conversationId}`, { text });
    return response.data;
  },

  async createConversation(
    userId: string,
    message?: string
  ): Promise<{
    conversationId: string;
    message: Message | null;
  }> {
    const body: { userId: string; message?: string } = { userId };
    if (message && message.trim()) {
      body.message = message;
    }
    const response = await apiClient.post('/me/messages/conversations', body);
    return response.data;
  },

  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/me/messages/conversations/${conversationId}/read`);
    return response.data;
  },
};
