import { useState, useCallback, useRef, useEffect } from 'react';
import { socketService } from '../api/socket';

interface UseSocketResult {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useSocket = (): UseSocketResult => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  // Use refs to track state without causing callback reference changes
  const isConnectingRef = useRef(false);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isConnectingRef.current = isConnecting;
  }, [isConnecting]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Use empty deps to keep callback reference stable
  const connect = useCallback(async () => {
    // Use refs instead of state to avoid stale closures and prevent retries
    if (isConnectingRef.current || isConnectedRef.current) return;

    try {
      isConnectingRef.current = true;
      setIsConnecting(true);
      setError(null);

      // Connect and get the socket instance
      const socket = await socketService.connect();

      // Register event handlers directly on the socket instance
      // This ensures they're bound AFTER the socket exists
      socket.off('disconnect'); // Remove any existing listeners first
      socket.off('connect');

      socket.on('disconnect', () => {
        console.log('[useSocket] Socket disconnected');
        isConnectedRef.current = false;
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      });

      socket.on('connect', () => {
        console.log('[useSocket] Socket reconnected');
        isConnectedRef.current = true;
        if (isMountedRef.current) {
          setIsConnected(true);
        }
      });

      isConnectedRef.current = true;
      if (isMountedRef.current) {
        setIsConnected(true);
        console.log('[useSocket] Socket connected successfully');
      }
    } catch (err) {
      // Log error but don't crash - connection can be retried manually
      console.warn('[useSocket] Connection error:', (err as Error).message);
      isConnectedRef.current = false;
      if (isMountedRef.current) {
        setError(err as Error);
        setIsConnected(false);
      }
    } finally {
      isConnectingRef.current = false;
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, []); // Empty deps - callback reference stays stable

  const disconnect = useCallback(() => {
    socketService.disconnect();
    isConnectedRef.current = false;
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };
};
