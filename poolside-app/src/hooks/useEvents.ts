import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsService, ApiEvent, EventFilters } from '../api';

interface UseEventsResult {
  events: ApiEvent[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useEvents = (filters?: EventFilters): UseEventsResult => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Use refs to avoid stale closures and make refresh stable
  const cursorRef = useRef<string | null>(null);
  const filtersRef = useRef(filters);
  const isMountedRef = useRef(true);

  // Update filters ref when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchEvents = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build params - only include cursor if not resetting and we have one
      const params: EventFilters = {
        ...filtersRef.current,
      };

      // Only add cursor for pagination (not on initial/refresh fetch)
      if (!reset && cursorRef.current) {
        params.cursor = cursorRef.current;
      }

      const response = await eventsService.getEvents(params);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (reset) {
        setEvents(response.events);
      } else {
        setEvents((prev) => [...prev, ...response.events]);
      }

      // Store the cursor for next page
      cursorRef.current = response.nextCursor || null;
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching events:', err);
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []); // No dependencies - uses refs instead

  // Initial fetch
  useEffect(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  // Refetch when filters change
  useEffect(() => {
    if (filters?.date !== undefined || filters?.location !== undefined) {
      fetchEvents(true);
    }
  }, [filters?.date, filters?.location, fetchEvents]);

  // Stable refresh function that always fetches fresh data
  const refresh = useCallback(async () => {
    cursorRef.current = null;
    await fetchEvents(true);
  }, [fetchEvents]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchEvents(false);
    }
  }, [isLoading, hasMore, fetchEvents]);

  return { events, isLoading, error, hasMore, total, refresh, loadMore };
};

export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await eventsService.getEventById(eventId);
      setEvent(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, isLoading, error, refresh: fetchEvent };
};
