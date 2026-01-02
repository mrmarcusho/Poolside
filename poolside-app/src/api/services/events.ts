import { apiClient } from '../client';

export interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  fullDescription?: string | null;
  locationName: string;
  locationDeck?: string | null;
  locationImage?: string | null;
  eventImage?: string | null;
  dateTime: string;
  endTime?: string;
  category?: string | null;
  theme?: Record<string, unknown> | null;
  host: {
    id: string;
    name: string;
    emoji: string | null;
    avatar: string | null;
  };
  rsvpCount?: {
    going: number;
    interested: number;
  } | number;
  myRsvp?: string | null;
  createdAt?: string;
}

export interface EventsResponse {
  events: ApiEvent[];
  hasMore: boolean;
  total: number;
  nextCursor?: string | null;
}

export interface EventFilters {
  date?: string;
  location?: string;
  hostId?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  fullDescription?: string;
  locationName: string;
  locationDeck?: string;
  locationImage?: string;
  eventImage?: string;
  dateTime: string;
  endTime?: string;
  category?: string;
  theme?: Record<string, unknown>;
}

export interface EventAttendee {
  id: string;
  name: string;
  emoji: string | null;
  avatar: string | null;
  status: 'GOING' | 'INTERESTED';
}

export const eventsService = {
  async getEvents(filters?: EventFilters): Promise<EventsResponse> {
    const response = await apiClient.get<EventsResponse>('/events', { params: filters });
    return response.data;
  },

  async getEventById(eventId: string): Promise<ApiEvent> {
    const response = await apiClient.get<ApiEvent>(`/events/${eventId}`);
    return response.data;
  },

  async createEvent(data: CreateEventData): Promise<ApiEvent> {
    const response = await apiClient.post<ApiEvent>('/events', data);
    return response.data;
  },

  async updateEvent(eventId: string, data: Partial<CreateEventData>): Promise<ApiEvent> {
    const response = await apiClient.patch<ApiEvent>(`/events/${eventId}`, data);
    return response.data;
  },

  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  },

  async getEventAttendees(eventId: string): Promise<{ attendees: EventAttendee[] }> {
    const response = await apiClient.get(`/events/${eventId}/attendees`);
    return response.data;
  },
};
