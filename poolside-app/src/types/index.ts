export interface User {
  id: string;
  name: string;
  avatar: string;
  emoji?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  locationName: string;
  locationDeck: string;
  locationImage: string;
  eventImage: string;
  dateTime: Date;
  endTime: Date;
  hosts: User[];
  attendees: User[];
  maybes: User[];
  theme: EventTheme;
  rsvpCount: number;
}

export interface EventTheme {
  backgroundColor: string;
  gradientColors: string[];
  fontFamily: string;
  accentColor: string;
}

export type RSVPStatus = 'none' | 'going' | 'maybe' | 'cant';
