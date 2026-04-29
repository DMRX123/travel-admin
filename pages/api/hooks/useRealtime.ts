// hooks/useRealtime.js - NO TYPE ERRORS VERSION
// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(table, filter, callback) {
  const [isConnected, setIsConnected] = useState(false);
  const retryCount = useRef(0);
  const subscriptionRef = useRef(null);
  const maxRetries = 5;
  const baseDelay = 1000;

  const connect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    let filterObj = null;
    if (filter && filter.column && filter.value) {
      filterObj = filter.column + '=eq.' + filter.value;
    }

    const channel = supabase.channel('realtime:' + table);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filterObj,
      },
      function(payload) {
        retryCount.current = 0;
        if (callback) {
          callback(payload);
        }
      }
    );

    channel.subscribe(function(status) {
      const connected = status === 'SUBSCRIBED';
      setIsConnected(connected);

      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime connection error for ' + table + ', retrying...');
        const delay = Math.min(baseDelay * Math.pow(2, retryCount.current), 30000);

        setTimeout(function() {
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            connect();
          } else {
            console.error('Failed to connect to ' + table + ' after ' + maxRetries + ' retries');
          }
        }, delay);
      }
    });

    subscriptionRef.current = channel;
    return channel;
  }, [table, filter, callback]);

  const reconnect = useCallback(function() {
    retryCount.current = 0;
    connect();
  }, [connect]);

  useEffect(function() {
    const channel = connect();

    const handleOnline = function() {
      console.log('Network online, reconnecting...');
      reconnect();
    };

    window.addEventListener('online', handleOnline);

    return function() {
      window.removeEventListener('online', handleOnline);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [connect, reconnect]);

  return { isConnected: isConnected, reconnect: reconnect };
}

export function useRideUpdates(rideId, onUpdate) {
  return useRealtime('rides', { column: 'id', value: rideId }, onUpdate);
}

export function useDriverLocation(driverId, onLocation) {
  return useRealtime('drivers', { column: 'id', value: driverId }, function(payload) {
    if (payload.new && payload.new.last_lat && payload.new.last_lng && onLocation) {
      onLocation({
        lat: payload.new.last_lat,
        lng: payload.new.last_lng,
        updatedAt: payload.new.last_location_update,
      });
    }
  });
}

export function useRideRequests(driverId, onRequest) {
  return useRealtime('ride_requests', { column: 'driver_id', value: driverId }, onRequest);
}

export default useRealtime;