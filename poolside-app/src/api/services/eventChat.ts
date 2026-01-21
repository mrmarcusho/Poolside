import { apiClient } from '../client';

export interface EventChatInfo {
  id: string;
  title: string;
  eventImage: string | null;
  dateTime: string;
  host: {
    id: string;
    name: string;
    emoji: string;
    avatar: string | null;
  };
  goingCount: number;
  isHost: boolean;
}

export interface EventChat {
  id: string;
  title: string;
  eventImage: string | null;
  dateTime: string;
  host: {
    id: string;
    name: string;
    emoji: string;
    avatar: string | null;
  };
  isHost: boolean;
  lastMessage: {
    text: string;
    senderName: string;
    sentAt: string;
    isFromMe: boolean;
  } | null;
  messageCount: number;
  unreadCount: number;
}

export interface EventMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderEmoji: string;
  senderAvatar: string | null;
  sentAt: string;
}

export interface EventMessagesResponse {
  messages: EventMessage[];
  hasMore: boolean;
}

export const eventChatService = {
  async getEventChats(): Promise<{ eventChats: EventChat[] }> {
    const response = await apiClient.get('/me/event-chats');
    return response.data;
  },

  async getEventChatInfo(eventId: string): Promise<EventChatInfo> {
    const response = await apiClient.get(`/events/${eventId}/chat`);
    return response.data;
  },

  async getEventMessages(
    eventId: string,
    limit?: number,
    before?: string
  ): Promise<EventMessagesResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);

    const response = await apiClient.get(
      `/events/${eventId}/chat/messages?${params.toString()}`
    );
    return response.data;
  },

  async sendEventMessage(
    eventId: string,
    text: string
  ): Promise<EventMessage> {
    const response = await apiClient.post(`/events/${eventId}/chat/messages`, {
      text,
    });
    return response.data;
  },

  async markEventChatAsRead(eventId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/events/${eventId}/chat/read`);
    return response.data;
  },
};
