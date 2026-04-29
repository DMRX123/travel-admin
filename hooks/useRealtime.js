// hooks/useRealtime.js - REAL-TIME WITH AUTO-RECONNECT
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(table, filter = null, callback = null, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);
  const retryCount = useRef(0);
  const subscriptionRef = useRef(null);
  const maxRetries = options.maxRetries || 5;
  const baseDelay = options.baseDelay || 1000;

  const connect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = supabase.channel(`realtime:${table}`);

    // Set up event handlers
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table, filter },
      (payload) => {
        retryCount.current = 0; // Reset retry on successful message
        setLastPayload(payload);
        if (callback) callback(payload);
      }
    );

    // Subscribe with status tracking
    channel.subscribe((status) => {
      const connected = status === 'SUBSCRIBED';
      setIsConnected(connected);
      
      if (status === 'CHANNEL_ERROR') {
        console.warn(`Realtime connection error for ${table}, retrying...`);
        const delay = Math.min(baseDelay * Math.pow(2, retryCount.current), 30000);
        
        setTimeout(() => {
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            connect();
          } else {
            console.error(`Failed to connect to ${table} after ${maxRetries} retries`);
          }
        }, delay);
      }
    });

    subscriptionRef.current = channel;
    return channel;
  }, [table, filter, callback, maxRetries, baseDelay]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    retryCount.current = 0;
    connect();
  }, [connect]);

  // Auto-connect on mount
  useEffect(() => {
    const channel = connect();
    
    // Handle online/offline events
    const handleOnline = () => {
      console.log('Network online, reconnecting...');
      reconnect();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [connect, reconnect]);

  return { isConnected, lastPayload, reconnect };
}

// Specific hooks for common use cases
export function useRideUpdates(rideId, onUpdate) {
  return useRealtime('rides', `id=eq.${rideId}`, onUpdate);
}

export function useDriverLocation(driverId, onLocation) {
  return useRealtime('drivers', `id=eq.${driverId}`, (payload) => {
    if (payload.new?.last_lat && payload.new?.last_lng) {
      onLocation?.({
        lat: payload.new.last_lat,
        lng: payload.new.last_lng,
        updatedAt: payload.new.last_location_update
      });
    }
  });
}

export function useRideRequests(driverId, onRequest) {
  return useRealtime('ride_requests', `driver_id=eq.${driverId}`, onRequest);
}

export default useRealtime;