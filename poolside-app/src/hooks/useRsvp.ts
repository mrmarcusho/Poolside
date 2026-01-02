import { useState, useEffect, useCallback } from 'react';
import { rsvpService, RsvpStatus, ApiEvent } from '../api';

interface RsvpItem {
  id: string;
  status: RsvpStatus;
  event: ApiEvent;
  createdAt: string;
}

interface UseMyRsvpsResult {
  rsvps: RsvpItem[];
  goingEvents: ApiEvent[];
  interestedEvents: ApiEvent[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useMyRsvps = (): UseMyRsvpsResult => {
  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRsvps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await rsvpService.getMyRsvps();
      setRsvps(response.rsvps);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRsvps();
  }, [fetchRsvps]);

  const goingEvents = rsvps
    .filter((r) => r.status === 'GOING')
    .map((r) => r.event);

  const interestedEvents = rsvps
    .filter((r) => r.status === 'INTERESTED')
    .map((r) => r.event);

  return { rsvps, goingEvents, interestedEvents, isLoading, error, refresh: fetchRsvps };
};

interface UseRsvpActionsResult {
  rsvp: (eventId: string, status: RsvpStatus) => Promise<void>;
  removeRsvp: (eventId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useRsvpActions = (): UseRsvpActionsResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const rsvp = useCallback(async (eventId: string, status: RsvpStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      await rsvpService.createRsvp(eventId, status);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeRsvp = useCallback(async (eventId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await rsvpService.removeRsvp(eventId);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rsvp, removeRsvp, isLoading, error };
};
