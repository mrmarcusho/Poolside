import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsService, ApiEvent, EventFilters } from '../api';
import { socketService, EventRsvpUpdatedEvent } from '../api/socket';

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

  // Listen for real-time RSVP updates
  useEffect(() => {
    let isSubscribed = true;
    let currentHandler: ((data: EventRsvpUpdatedEvent) => void) | null = null;

    const handleRsvpUpdate = (data: EventRsvpUpdatedEvent) => {
      if (!isMountedRef.current || !isSubscribed) return;

      console.log('[useEvents] RSVP update received:', JSON.stringify(data));

      // Update the RSVP count and isFull status for the event
      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === data.eventId) {
            console.log(`[useEvents] Updating event ${data.eventId}: isFull=${data.isFull}, going=${data.rsvpCount.going}`);
            return {
              ...event,
              rsvpCount: data.rsvpCount,
              isFull: data.isFull,
            };
          }
          return event;
        })
      );
    };

    // Connect to socket and register listener
    const setupSocket = async () => {
      try {
        console.log('[useEvents] Setting up socket, isConnected:', socketService.isConnected());
        // Connect if not already connected
        if (!socketService.isConnected()) {
          console.log('[useEvents] Connecting to socket...');
          await socketService.connect();
          console.log('[useEvents] Socket connected successfully');
        }
        // Register listener
        console.log('[useEvents] Registering event_rsvp_updated listener');
        currentHandler = handleRsvpUpdate;
        socketService.onEventRsvpUpdated(handleRsvpUpdate);
        console.log('[useEvents] Listener registered, socket connected:', socketService.isConnected());

        // Also register for reconnect to re-setup listener
        socketService.onReconnect(() => {
          console.log('[useEvents] Socket reconnected, re-registering RSVP listener');
          if (currentHandler && isSubscribed) {
            socketService.onEventRsvpUpdated(currentHandler);
          }
        });
      } catch (err) {
        console.warn('[useEvents] Socket connection failed:', err);
      }
    };

    setupSocket();

    return () => {
      isSubscribed = false;
      if (currentHandler) {
        socketService.offEventRsvpUpdated(currentHandler);
      }
    };
  }, []);

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
