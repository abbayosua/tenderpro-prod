'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimeNotification {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
}

interface UseRealtimeNotificationsOptions {
  userId?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseRealtimeNotificationsReturn {
  notifications: RealtimeNotification[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connect: () => void;
  disconnect: () => void;
  sendNotification: (targetUserId: string, data: RealtimeNotification) => void;
  clearNotifications: () => void;
}

export function useRealtimeNotifications({
  userId,
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseRealtimeNotificationsOptions = {}): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<UseRealtimeNotificationsReturn['connectionStatus']>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const connectRef = useRef<() => void>(() => {});

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mountedRef.current) {
      setConnectionStatus('disconnected');
    }
  }, []);

  const connect = useCallback(() => {
    if (!userId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (mountedRef.current) {
      setConnectionStatus('connecting');
    }

    try {
      const ws = new WebSocket('ws://localhost/?XTransformPort=3005');

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');
        // Authenticate with userId
        ws.send(JSON.stringify({ type: 'auth', userId }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'notification' && msg.data) {
            const notification: RealtimeNotification = {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ...msg.data,
            };
            setNotifications((prev) => [notification, ...prev]);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('disconnected');

        // Auto-reconnect using ref to avoid circular dependency
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, reconnectInterval);
        }
      };

      ws.onerror = () => {
        if (mountedRef.current) {
          setConnectionStatus('error');
        }
      };

      wsRef.current = ws;
    } catch {
      if (mountedRef.current) {
        setConnectionStatus('error');
      }
    }
  }, [userId, reconnectInterval, maxReconnectAttempts]);

  // Keep ref in sync
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const sendNotification = useCallback((targetUserId: string, data: RealtimeNotification) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'notification',
        targetUserId,
        data,
      }));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-connect when userId is available
  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect && userId) {
      // Use setTimeout to avoid calling setState synchronously in effect
      const timer = setTimeout(() => connect(), 0);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        disconnect();
      };
    }
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  return {
    notifications,
    connectionStatus,
    connect,
    disconnect,
    sendNotification,
    clearNotifications,
  };
}
