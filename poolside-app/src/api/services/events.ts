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
  spots?: number | null;
  displayDuration?: number; // Duration in minutes to show event on feed
  isFull?: boolean; // True when spots limit is reached
  waitlistEnabled?: boolean; // Allow users to join waitlist when full
  hideDetailsWhenFull?: boolean; // Hide location & time from non-attendees when full
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
  status?: 'DRAFT' | 'PUBLISHED';
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
  spots?: number; // Max capacity (null/undefined = unlimited)
  displayDuration?: number; // Duration in minutes to show event on feed (30-180)
  status?: 'DRAFT' | 'PUBLISHED';
  waitlistEnabled?: boolean; // Allow users to join waitlist when full
  hideDetailsWhenFull?: boolean; // Hide location & time from non-attendees when full
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
