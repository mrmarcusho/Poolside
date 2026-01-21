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
  spots?: number; // Max capacity, undefined means unlimited
  displayDuration: number; // Duration in minutes to show event on feed
  status?: 'DRAFT' | 'PUBLISHED';
  isFull?: boolean; // True when spots limit is reached
  waitlistEnabled?: boolean; // Allow users to join waitlist when full
  hideDetailsWhenFull?: boolean; // Hide location & time from non-attendees when full
}

export interface EventTheme {
  backgroundColor: string;
  gradientColors: string[];
  fontFamily: string;
  accentColor: string;
}

export type RSVPStatus = 'none' | 'going' | 'maybe' | 'cant';
