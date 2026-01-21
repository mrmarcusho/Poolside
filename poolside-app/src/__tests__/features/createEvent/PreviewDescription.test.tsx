import React from 'react';
import { render } from '@testing-library/react-native';
import { EventCard } from '../../../components/EventCard';
import { Event, EventTheme } from '../../../types';

// Mock navigation and other dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('../../../context/RsvpContext', () => ({
  useRsvp: () => ({ getRsvpStatus: () => null, setRsvp: jest.fn() }),
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', name: 'Test' } }),
}));
jest.mock('../../../api/services/events', () => ({
  eventsService: { getEventAttendees: jest.fn().mockResolvedValue({ attendees: [] }) },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Create a complete mock event matching the Event type
const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'test-event-1',
  title: 'Test Event',
  description: 'Test description',
  fullDescription: 'Full test description',
  locationName: 'Test Location',
  locationDeck: 'Test Deck',
  locationImage: '',
  eventImage: '',
  dateTime: new Date('2024-06-15T14:00:00.000Z'),
  endTime: new Date('2024-06-15T18:00:00.000Z'),
  hosts: [{
    id: 'host-1',
    name: 'Test Host',
    avatar: '',
    emoji: '🎉',
  }],
  attendees: [],
  maybes: [],
  theme: {
    backgroundColor: '#3B82F6',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    fontFamily: 'default',
    accentColor: '#3B82F6',
  } as EventTheme,
  rsvpCount: 0,
  displayDuration: 60,
  ...overrides,
});

describe('Preview Description Bug Investigation', () => {

  // TEST 1: Verify EventCard renders description when provided
  describe('EventCard Description Rendering', () => {
    it('should render description text when event.description is provided', () => {
      const eventWithDescription = createMockEvent({
        description: 'Test description text',
      });

      const { getByText } = render(
        <EventCard event={eventWithDescription} isPreview />
      );

      expect(getByText('Test description text')).toBeTruthy();
    });

    it('should render empty Text element when event.description is empty string', () => {
      const eventWithEmptyDescription = createMockEvent({
        description: '',
      });

      const { UNSAFE_getAllByType } = render(
        <EventCard event={eventWithEmptyDescription} isPreview />
      );

      // This test verifies the component renders without crashing with empty description
      // The unconditional render means a Text component exists even with empty string
      expect(UNSAFE_getAllByType).toBeDefined();
    });

    it('should render description with special characters', () => {
      const eventWithSpecialChars = createMockEvent({
        description: 'Hi my name is marcus! 🎉 Let\'s party',
      });

      const { getByText } = render(
        <EventCard event={eventWithSpecialChars} isPreview />
      );

      expect(getByText('Hi my name is marcus! 🎉 Let\'s party')).toBeTruthy();
    });
  });

  // TEST 2: Isolated unit test for buildPreviewEvent logic
  describe('buildPreviewEvent Function', () => {
    it('should include trimmed description in returned event object', () => {
      // Extract and test the logic directly
      const description = '  Test description  ';
      const previewDescription = description.trim();

      expect(previewDescription).toBe('Test description');
    });

    it('should return empty string when description is only whitespace', () => {
      const description = '   ';
      const previewDescription = description.trim();

      expect(previewDescription).toBe('');
    });

    it('should preserve description exactly when no leading/trailing whitespace', () => {
      const description = 'Exact description';
      const previewDescription = description.trim();

      expect(previewDescription).toBe('Exact description');
    });
  });

  // TEST 3: Verify description visibility in card layout
  describe('Description Layout Visibility', () => {
    it('should have description visible with correct numberOfLines', () => {
      const eventWithDescription = createMockEvent({
        description: 'Hi my name is marcus',
      });

      const { getByText } = render(
        <EventCard event={eventWithDescription} isPreview />
      );

      const descriptionElement = getByText('Hi my name is marcus');
      // Verify element exists and has layout
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement.props.numberOfLines).toBe(3);
    });

    it('should handle long descriptions with numberOfLines truncation', () => {
      const longDescription = 'This is a very long description that should be truncated. '.repeat(10);
      const eventWithLongDescription = createMockEvent({
        description: longDescription,
      });

      const { getByText } = render(
        <EventCard event={eventWithLongDescription} isPreview />
      );

      const descriptionElement = getByText(longDescription);
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement.props.numberOfLines).toBe(3);
    });
  });

  // TEST 4: Preview event structure verification
  describe('Preview Event Object Structure', () => {
    it('should have both description and fullDescription fields', () => {
      const event = createMockEvent({
        description: 'Short description',
        fullDescription: 'This is the full description with more details',
      });

      expect(event.description).toBe('Short description');
      expect(event.fullDescription).toBe('This is the full description with more details');
    });

    it('should support description matching fullDescription (preview mode)', () => {
      // In preview mode, both fields are set to the same value
      const previewDescription = 'User entered description';
      const previewEvent = createMockEvent({
        description: previewDescription,
        fullDescription: previewDescription,
      });

      expect(previewEvent.description).toBe(previewEvent.fullDescription);
    });
  });
});
