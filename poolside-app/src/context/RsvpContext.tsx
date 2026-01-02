import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { rsvpService, RsvpStatus as ApiRsvpStatus, ApiEvent } from '../api';

type RsvpStatus = 'going' | 'interested';

interface RsvpItem {
  id: string;
  status: ApiRsvpStatus;
  event: ApiEvent;
  createdAt: string;
}

interface RsvpContextType {
  rsvpEvents: Record<string, RsvpStatus>;
  rsvpData: RsvpItem[];
  isLoading: boolean;
  setRsvp: (eventId: string, status: RsvpStatus | null) => Promise<void>;
  getRsvpStatus: (eventId: string) => RsvpStatus | null;
  getEventsByStatus: (status: RsvpStatus) => ApiEvent[];
  refresh: () => Promise<void>;
}

const RsvpContext = createContext<RsvpContextType | undefined>(undefined);

// Convert API status to local status (now both use lowercase)
const apiToLocalStatus = (status: ApiRsvpStatus): RsvpStatus => {
  return status === 'going' ? 'going' : 'interested';
};

// Convert local status to API status (now both use lowercase)
const localToApiStatus = (status: RsvpStatus): ApiRsvpStatus => {
  return status; // Both are now lowercase
};

export const RsvpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rsvpData, setRsvpData] = useState<RsvpItem[]>([]);
  const [rsvpEvents, setRsvpEvents] = useState<Record<string, RsvpStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch RSVPs from API
  const fetchRsvps = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await rsvpService.getMyRsvps();
      setRsvpData(response.rsvps);

      // Build local state map
      const rsvpMap: Record<string, RsvpStatus> = {};
      response.rsvps.forEach((rsvp) => {
        rsvpMap[rsvp.event.id] = apiToLocalStatus(rsvp.status);
      });
      setRsvpEvents(rsvpMap);
    } catch (error) {
      // If not authenticated or error, use empty state
      console.log('Error fetching RSVPs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRsvps();
  }, [fetchRsvps]);

  const setRsvp = useCallback(async (eventId: string, status: RsvpStatus | null) => {
    try {
      if (status === null) {
        // Remove RSVP
        await rsvpService.removeRsvp(eventId);
        setRsvpEvents((prev) => {
          const { [eventId]: _, ...rest } = prev;
          return rest;
        });
        setRsvpData((prev) => prev.filter((r) => r.event.id !== eventId));
      } else {
        // Create or update RSVP
        await rsvpService.createRsvp(eventId, localToApiStatus(status));
        setRsvpEvents((prev) => ({ ...prev, [eventId]: status }));
        // Refresh to get full event data
        await fetchRsvps();
      }
    } catch (error) {
      console.error('Error setting RSVP:', error);
      // Optimistically update local state even on error (for offline support)
      if (status === null) {
        setRsvpEvents((prev) => {
          const { [eventId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        setRsvpEvents((prev) => ({ ...prev, [eventId]: status }));
      }
    }
  }, [fetchRsvps]);

  const getRsvpStatus = useCallback((eventId: string): RsvpStatus | null => {
    return rsvpEvents[eventId] || null;
  }, [rsvpEvents]);

  const getEventsByStatus = useCallback((status: RsvpStatus): ApiEvent[] => {
    return rsvpData
      .filter((r) => apiToLocalStatus(r.status) === status)
      .map((r) => r.event);
  }, [rsvpData]);

  return (
    <RsvpContext.Provider value={{
      rsvpEvents,
      rsvpData,
      isLoading,
      setRsvp,
      getRsvpStatus,
      getEventsByStatus,
      refresh: fetchRsvps,
    }}>
      {children}
    </RsvpContext.Provider>
  );
};

export const useRsvp = () => {
  const context = useContext(RsvpContext);
  if (!context) {
    throw new Error('useRsvp must be used within an RsvpProvider');
  }
  return context;
};
