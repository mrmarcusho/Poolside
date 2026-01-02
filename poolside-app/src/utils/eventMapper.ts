import { Event, User, EventTheme } from '../types';
import { ApiEvent } from '../api';

// Default theme when none provided
const defaultTheme: EventTheme = {
  backgroundColor: '#1a1a2e',
  gradientColors: ['#667eea', '#764ba2'],
  fontFamily: 'System',
  accentColor: '#667eea',
};

// Convert API event to frontend Event format
// Handles both full events (from /events) and partial events (from /me/rsvps)
export const mapApiEventToEvent = (apiEvent: ApiEvent): Event => {
  const host: User = {
    id: apiEvent.host?.id || '',
    name: apiEvent.host?.name || 'Unknown',
    avatar: apiEvent.host?.avatar || 'https://i.pravatar.cc/150',
    emoji: apiEvent.host?.emoji || '👤',
  };

  // Calculate rsvpCount - handle both object and number formats
  let rsvpCount = 0;
  if (apiEvent.rsvpCount) {
    if (typeof apiEvent.rsvpCount === 'number') {
      rsvpCount = apiEvent.rsvpCount;
    } else {
      rsvpCount = (apiEvent.rsvpCount.going || 0) + (apiEvent.rsvpCount.interested || 0);
    }
  }

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description || '',
    fullDescription: apiEvent.fullDescription || apiEvent.description || '',
    locationName: apiEvent.locationName,
    locationDeck: apiEvent.locationDeck || '',
    locationImage: apiEvent.locationImage || '',
    eventImage: apiEvent.eventImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    dateTime: new Date(apiEvent.dateTime),
    endTime: apiEvent.endTime ? new Date(apiEvent.endTime) : new Date(apiEvent.dateTime),
    hosts: [host],
    attendees: [], // Will be fetched separately if needed
    maybes: [],
    theme: (apiEvent.theme as EventTheme) || defaultTheme,
    rsvpCount,
  };
};

// Convert an array of API events
export const mapApiEventsToEvents = (apiEvents: ApiEvent[]): Event[] => {
  return apiEvents.map(mapApiEventToEvent);
};
