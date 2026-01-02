import { apiClient } from '../client';
import { ApiEvent } from './events';

export type RsvpStatus = 'going' | 'interested';

export interface RsvpResponse {
  id: string;
  eventId: string;
  status: RsvpStatus;
  createdAt: string;
}

export interface MyRsvpsResponse {
  rsvps: Array<{
    id: string;
    status: RsvpStatus;
    event: ApiEvent;
    createdAt: string;
  }>;
}

export const rsvpService = {
  async createRsvp(eventId: string, status: RsvpStatus): Promise<RsvpResponse> {
    const response = await apiClient.post<RsvpResponse>(`/events/${eventId}/rsvp`, { status });
    return response.data;
  },

  async removeRsvp(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/rsvp`);
  },

  async getMyRsvps(): Promise<MyRsvpsResponse> {
    const response = await apiClient.get<MyRsvpsResponse>('/me/rsvps');
    return response.data;
  },
};
