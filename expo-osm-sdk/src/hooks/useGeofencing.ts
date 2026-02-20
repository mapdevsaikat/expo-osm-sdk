/**
 * useGeofencing Hook
 * 
 * Real-time geofencing for location-based apps
 * 
 * Features:
 * - Circle and polygon geofences
 * - Enter, exit, and dwell events
 * - Multiple geofence monitoring
 * - Performance optimized
 * - TypeScript support
 * 
 * @example
 * ```tsx
 * const { activeGeofences, isInGeofence } = useGeofencing(geofences, {
 *   onEnter: (event) => console.log('Entered:', event.geofenceName),
 *   onExit: (event) => console.log('Exited:', event.geofenceName),
 *   checkInterval: 5000,
 * });
 * ```
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { 
  isPointInGeofence, 
  validateGeofence, 
  distanceToGeofence 
} from '../utils/geofencing';
import type {
  Geofence,
  GeofenceEvent,
  GeofenceState,
  UseGeofencingOptions,
  UseGeofencingReturn,
  Coordinate,
  OSMViewRef,
} from '../types';

/**
 * Hook for monitoring geofences and detecting enter/exit/dwell events
 * 
 * @param mapRef Reference to OSMView component
 * @param geofences Array of geofences to monitor
 * @param options Configuration options
 * @returns Geofencing state and controls
 */
export function useGeofencing(
  mapRef: React.RefObject<OSMViewRef>,
  geofences: Geofence[],
  options: UseGeofencingOptions = {}
): UseGeofencingReturn {
  const {
    checkInterval = 5000, // Check every 5 seconds
    dwellThreshold = 60000, // 1 minute
    enableHighAccuracy = true,
    onEnter,
    onExit,
    onDwell,
    onEvent,
  } = options;

  // State
  const [activeGeofences, setActiveGeofences] = useState<string[]>([]);
  const [geofenceStates, setGeofenceStates] = useState<Map<string, GeofenceState>>(new Map());
  const [events, setEvents] = useState<GeofenceEvent[]>([]);

  // Refs for callbacks (avoid re-creating interval on callback changes)
  const onEnterRef = useRef(onEnter);
  const onExitRef = useRef(onExit);
  const onDwellRef = useRef(onDwell);
  const onEventRef = useRef(onEvent);

  // Ref for dwell check intervals
  const dwellCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onEnterRef.current = onEnter;
    onExitRef.current = onExit;
    onDwellRef.current = onDwell;
    onEventRef.current = onEvent;
  }, [onEnter, onExit, onDwell, onEvent]);

  // Track location
  const { currentLocation, isTracking } = useLocationTracking(mapRef, {
    autoStart: true,
  });

  // Validate geofences on mount
  useEffect(() => {
    const invalidGeofences = geofences.filter(g => !validateGeofence(g));
    if (invalidGeofences.length > 0) {
      console.warn(`Found ${invalidGeofences.length} invalid geofences`);
    }
  }, [geofences]);

  /**
   * Emit a geofence event
   */
  const emitEvent = useCallback((event: GeofenceEvent) => {
    // Add to events array
    setEvents(prev => [...prev, event]);

    // Call specific callback
    if (event.type === 'enter' && onEnterRef.current) {
      onEnterRef.current(event);
    } else if (event.type === 'exit' && onExitRef.current) {
      onExitRef.current(event);
    } else if (event.type === 'dwell' && onDwellRef.current) {
      onDwellRef.current(event);
    }

    // Call general callback
    if (onEventRef.current) {
      onEventRef.current(event);
    }
  }, []);

  /**
   * Check all geofences for current location
   */
  const checkGeofences = useCallback(() => {
    if (!currentLocation) return;

    const now = Date.now();
    const newActiveGeofences: string[] = [];
    const newStates = new Map(geofenceStates);

    geofences.forEach(geofence => {
      const isInside = isPointInGeofence(currentLocation, geofence);
      const wasInside = activeGeofences.includes(geofence.id);

      if (isInside) {
        newActiveGeofences.push(geofence.id);

        if (!wasInside) {
          // ENTER event
          const distance = Math.abs(distanceToGeofence(currentLocation, geofence));
          
          emitEvent({
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            type: 'enter',
            coordinate: currentLocation,
            timestamp: now,
            distance,
            metadata: geofence.metadata,
          });

          // Initialize state
          newStates.set(geofence.id, {
            geofenceId: geofence.id,
            enteredAt: now,
            lastUpdate: now,
            dwellTime: 0,
          });
        } else {
          // Still inside - update state
          const state = newStates.get(geofence.id);
          if (state) {
            state.lastUpdate = now;
            state.dwellTime = now - state.enteredAt;
            newStates.set(geofence.id, state);
          }
        }
      } else if (wasInside) {
        // EXIT event
        const distance = Math.abs(distanceToGeofence(currentLocation, geofence));
        
        emitEvent({
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          type: 'exit',
          coordinate: currentLocation,
          timestamp: now,
          distance,
          metadata: geofence.metadata,
        });

        // Remove state
        newStates.delete(geofence.id);
      }
    });

    setActiveGeofences(newActiveGeofences);
    setGeofenceStates(newStates);
  }, [currentLocation, geofences, activeGeofences, geofenceStates, emitEvent]);

  /**
   * Check for dwell events
   */
  const checkDwellEvents = useCallback(() => {
    const now = Date.now();

    geofenceStates.forEach((state, geofenceId) => {
      const dwellTime = now - state.enteredAt;
      
      // Check if we just crossed the dwell threshold
      if (dwellTime >= dwellThreshold && state.dwellTime < dwellThreshold) {
        const geofence = geofences.find(g => g.id === geofenceId);
        
        if (geofence && currentLocation) {
          emitEvent({
            geofenceId,
            geofenceName: geofence.name,
            type: 'dwell',
            coordinate: currentLocation,
            timestamp: now,
            metadata: geofence.metadata,
          });
        }
      }
    });
  }, [geofenceStates, dwellThreshold, geofences, currentLocation, emitEvent]);

  // Set up geofence checking interval
  useEffect(() => {
    if (!currentLocation) return;

    // Initial check
    checkGeofences();

    // Set up interval
    const intervalId = setInterval(checkGeofences, checkInterval);

    return () => clearInterval(intervalId);
  }, [currentLocation, checkGeofences, checkInterval]);

  // Set up dwell checking interval (more frequent)
  useEffect(() => {
    if (geofenceStates.size === 0) return;

    // Check dwell every 1 second
    dwellCheckIntervalRef.current = setInterval(checkDwellEvents, 1000);

    return () => {
      if (dwellCheckIntervalRef.current) {
        clearInterval(dwellCheckIntervalRef.current);
      }
    };
  }, [checkDwellEvents, geofenceStates.size]);

  /**
   * Check if user is inside a specific geofence
   */
  const isInGeofence = useCallback(
    (geofenceId: string): boolean => {
      return activeGeofences.includes(geofenceId);
    },
    [activeGeofences]
  );

  /**
   * Get dwell time for a specific geofence
   */
  const getDwellTime = useCallback(
    (geofenceId: string): number => {
      const state = geofenceStates.get(geofenceId);
      if (!state) return 0;
      return Date.now() - state.enteredAt;
    },
    [geofenceStates]
  );

  return {
    activeGeofences,
    geofenceStates,
    isInGeofence,
    getDwellTime,
    checkGeofences,
    currentLocation,
    isTracking,
    events,
  };
}

/**
 * Simple helper hook for single geofence monitoring
 */
export function useSingleGeofence(
  mapRef: React.RefObject<OSMViewRef>,
  geofence: Geofence,
  options: UseGeofencingOptions = {}
) {
  const result = useGeofencing(mapRef, [geofence], options);
  
  return {
    ...result,
    isInside: result.isInGeofence(geofence.id),
    dwellTime: result.getDwellTime(geofence.id),
  };
}

