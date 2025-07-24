import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { type Route, type Coordinate, type RouteStep } from 'expo-osm-sdk';

interface SimpleNavigationUIProps {
  isNavigating: boolean;
  currentRoute: Route | null;
  currentLocation: Coordinate | null;
  destination: string;
  onExitNavigation: () => void;
  transportMode: string;
}

interface NavigationProgress {
  distanceRemaining: number;
  timeRemaining: number;
  nextInstruction: RouteStep | null;
  distanceToNextTurn: number;
  currentStepIndex: number;
  routeProgress: number; // 0-1
}

const SimpleNavigationUI: React.FC<SimpleNavigationUIProps> = ({
  isNavigating,
  currentRoute,
  currentLocation,
  destination,
  onExitNavigation,
  transportMode,
}) => {
  const [progress, setProgress] = useState<NavigationProgress>({
    distanceRemaining: 0,
    timeRemaining: 0,
    nextInstruction: null,
    distanceToNextTurn: 0,
    currentStepIndex: 0,
    routeProgress: 0,
  });

  // Calculate navigation progress
  const calculateProgress = useCallback((
    route: Route,
    userLocation: Coordinate
  ): NavigationProgress => {
    if (!route.steps.length) {
      return {
        distanceRemaining: route.distance,
        timeRemaining: route.duration,
        nextInstruction: null,
        distanceToNextTurn: 0,
        currentStepIndex: 0,
        routeProgress: 0,
      };
    }

    // Find closest point on route (simplified)
    let closestStepIndex = 0;
    let minDistance = Infinity;
    
    route.steps.forEach((step, index) => {
      const distance = calculateDistance(userLocation, step.coordinate);
      if (distance < minDistance) {
        minDistance = distance;
        closestStepIndex = index;
      }
    });

    // Calculate remaining distance and time
    let distanceRemaining = 0;
    let timeRemaining = 0;
    
    for (let i = closestStepIndex; i < route.steps.length; i++) {
      distanceRemaining += route.steps[i].distance;
      timeRemaining += route.steps[i].duration;
    }

    const nextInstruction = route.steps[closestStepIndex + 1] || route.steps[closestStepIndex];
    const distanceToNextTurn = nextInstruction ? nextInstruction.distance : 0;
    const routeProgress = 1 - (distanceRemaining / route.distance);

    return {
      distanceRemaining,
      timeRemaining,
      nextInstruction,
      distanceToNextTurn,
      currentStepIndex: closestStepIndex,
      routeProgress: Math.max(0, Math.min(1, routeProgress)),
    };
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI/180;
    const φ2 = coord2.latitude * Math.PI/180;
    const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
    const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Update progress when location or route changes
  useEffect(() => {
    if (currentRoute && currentLocation && isNavigating) {
      const newProgress = calculateProgress(currentRoute, currentLocation);
      setProgress(newProgress);
    }
  }, [currentLocation, currentRoute, isNavigating, calculateProgress]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Get transport mode icon
  const getTransportIcon = (mode: string): string => {
    switch (mode) {
      case 'car': return '🚗';
      case 'bike': return '🚴';
      case 'walk': return '🚶';
      case 'transit': return '🚌';
      default: return '🚗';
    }
  };

  // Get instruction icon based on maneuver
  const getInstructionIcon = (instruction: string): string => {
    const lower = instruction.toLowerCase();
    if (lower.includes('left')) return '↰';
    if (lower.includes('right')) return '↱';
    if (lower.includes('straight') || lower.includes('continue')) return '↑';
    if (lower.includes('roundabout')) return '⭕';
    if (lower.includes('arrive')) return '🏁';
    return '↑';
  };

  if (!isNavigating || !currentRoute) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.timeText}>
            {formatTime(progress.timeRemaining)}
          </Text>
          <View style={styles.routeDetails}>
            <Text style={styles.distanceText}>
              {formatDistance(progress.distanceRemaining)}
            </Text>
            <Text style={styles.destinationText}>
              towards {destination}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.exitButton} onPress={onExitNavigation}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Turn-by-turn Instructions */}
      {progress.nextInstruction && (
        <View style={styles.instructionPanel}>
          <View style={styles.instructionContent}>
            <View style={styles.instructionIcon}>
              <Text style={styles.maneuverIcon}>
                {getInstructionIcon(progress.nextInstruction.instruction)}
              </Text>
            </View>
            
            <View style={styles.instructionText}>
              <Text style={styles.instruction}>
                {progress.nextInstruction.instruction}
              </Text>
              <Text style={styles.instructionDistance}>
                in {formatDistance(progress.distanceToNextTurn)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress.routeProgress * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.centerInfo}>
          <Text style={styles.transportMode}>
            {getTransportIcon(transportMode)} {transportMode} Navigation
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    color: '#E0E0E0',
    marginRight: 8,
  },
  destinationText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  exitButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  instructionPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  instructionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  maneuverIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  instructionDistance: {
    fontSize: 14,
    color: '#666666',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerInfo: {
    alignItems: 'center',
  },
  transportMode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
});

export default SimpleNavigationUI; 