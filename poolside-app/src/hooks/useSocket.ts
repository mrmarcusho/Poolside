import { useState, useCallback, useRef } from 'react';
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

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Connect and get the socket instance
      const socket = await socketService.connect();

      // Register event handlers directly on the socket instance
      // This ensures they're bound AFTER the socket exists
      socket.on('disconnect', () => {
        console.log('[useSocket] Socket disconnected');
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      });

      socket.on('connect', () => {
        console.log('[useSocket] Socket reconnected');
        if (isMountedRef.current) {
          setIsConnected(true);
        }
      });

      if (isMountedRef.current) {
        setIsConnected(true);
        console.log('[useSocket] Socket connected successfully');
      }
    } catch (err) {
      console.error('[useSocket] Connection error:', err);
      if (isMountedRef.current) {
        setError(err as Error);
        setIsConnected(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
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
