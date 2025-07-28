import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  SafeAreaView,
} from 'react-native';
import { type Route, type Coordinate, type RouteStep } from 'expo-osm-sdk';
import { useVoiceGuidance } from './useVoiceGuidance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NavigationUIProps {
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

const NavigationUI: React.FC<NavigationUIProps> = ({
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
  
  const [showInstructions, setShowInstructions] = useState(true);
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Voice guidance integration
  const voiceGuidance = useVoiceGuidance();
  const lastAnnouncedStep = useRef<number>(-1);
  const hasAnnouncedStart = useRef<boolean>(false);

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

    // Find closest point on route (simplified - you could improve this)
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
      
      // Voice guidance logic
      if (newProgress.nextInstruction && newProgress.currentStepIndex !== lastAnnouncedStep.current) {
        const instruction = newProgress.nextInstruction.instruction;
        const distance = newProgress.distanceToNextTurn;
        
        // Announce instruction based on distance
        if (distance < 50 && distance > 0) {
          voiceGuidance.speakDistanceInstruction(instruction, distance);
          lastAnnouncedStep.current = newProgress.currentStepIndex;
        } else if (distance < 200 && distance > 150) {
          voiceGuidance.speakDistanceInstruction(instruction, distance);
        } else if (distance < 500 && distance > 400) {
          voiceGuidance.speakDistanceInstruction(instruction, distance);
        }
      }
    }
  }, [currentLocation, currentRoute, isNavigating, calculateProgress, voiceGuidance]);

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

  // Animate instructions in/out
  useEffect(() => {
    if (showInstructions) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showInstructions, slideAnim]);

  // Announce route start and completion (only once when navigation starts)
  useEffect(() => {
    if (isNavigating && currentRoute && destination && !hasAnnouncedStart.current) {
      // Announce route when navigation starts
      voiceGuidance.announceRoute(currentRoute.duration, currentRoute.distance, destination);
      voiceGuidance.initializeAudio();
      hasAnnouncedStart.current = true;
    } else if (!isNavigating) {
      // Reset the flag when navigation stops
      hasAnnouncedStart.current = false;
      lastAnnouncedStep.current = -1;
    }
  }, [isNavigating, currentRoute, destination, voiceGuidance]);

  // Check for arrival
  useEffect(() => {
    if (progress.routeProgress > 0.95 && progress.distanceRemaining < 100 && destination) {
      voiceGuidance.announceArrival(destination);
    }
  }, [progress.routeProgress, progress.distanceRemaining, destination, voiceGuidance]);

  if (!isNavigating || !currentRoute) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <Animated.View 
          style={[
            styles.instructionPanel,
            {
              opacity: slideAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                })
              }]
            }
          ]}
        >
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
          
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <Text style={styles.toggleIcon}>
              {showInstructions ? '⌄' : '⌃'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
        <TouchableOpacity 
          style={[
            styles.controlButton,
            { backgroundColor: voiceGuidance.isEnabled ? '#4CAF50' : '#F0F0F0' }
          ]}
          onPress={voiceGuidance.toggleVoiceGuidance}
        >
          <Text style={styles.controlText}>
            {voiceGuidance.isEnabled ? '🔊' : '🔇'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.centerInfo}>
          <Text style={styles.transportMode}>
            {getTransportIcon(transportMode)} {transportMode}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlText}>🔍</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1500, // Higher z-index to ensure it's above everything
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingTop: Platform.OS === 'ios' ? 8 : 16, // Reduced since SafeAreaView handles the status bar
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  routeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: SCREEN_WIDTH > 400 ? 28 : 24, // Responsive font size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: SCREEN_WIDTH > 400 ? 16 : 14,
    color: '#E0E0E0',
    marginRight: 8,
  },
  destinationText: {
    fontSize: SCREEN_WIDTH > 400 ? 16 : 14,
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
    width: SCREEN_WIDTH > 400 ? 56 : 50,
    height: SCREEN_WIDTH > 400 ? 56 : 50,
    borderRadius: SCREEN_WIDTH > 400 ? 28 : 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  maneuverIcon: {
    fontSize: SCREEN_WIDTH > 400 ? 26 : 24,
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
  },
  instruction: {
    fontSize: SCREEN_WIDTH > 400 ? 18 : 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    lineHeight: SCREEN_WIDTH > 400 ? 24 : 22,
  },
  instructionDistance: {
    fontSize: SCREEN_WIDTH > 400 ? 14 : 12,
    color: '#666666',
    fontWeight: '500',
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 18,
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
    justifyContent: 'space-between',
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
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 20,
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  transportMode: {
    fontSize: SCREEN_WIDTH > 400 ? 16 : 14,
    fontWeight: '500',
    color: '#333333',
  },
});

export default NavigationUI; 