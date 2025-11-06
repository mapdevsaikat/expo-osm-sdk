import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { type Route, type Coordinate, type RouteStep } from 'expo-osm-sdk';
import * as Speech from 'expo-speech';
import { formatDuration, formatDistance } from '../utils/formatters';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Voice guidance state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastAnnouncedStep = useRef<number>(-1);
  const announcedDistances = useRef<Set<string>>(new Set());
  const hasAnnouncedStart = useRef(false);
  const hasAnnouncedArrival = useRef(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((coord1: Coordinate, coord2: Coordinate): number => {
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
  }, []);

  // Calculate navigation progress
  const calculateProgress = useCallback((
    route: Route,
    userLocation: Coordinate
  ): NavigationProgress => {
    if (!route.steps || !route.steps.length) {
      return {
        distanceRemaining: route.distance || 0,
        timeRemaining: route.duration || 0,
        nextInstruction: null,
        distanceToNextTurn: 0,
        currentStepIndex: 0,
        routeProgress: 0,
      };
    }

    // Find closest point on route
    let closestStepIndex = 0;
    let minDistance = Infinity;
    
    route.steps.forEach((step, index) => {
      if (step.coordinate) {
        const distance = calculateDistance(userLocation, step.coordinate);
        if (distance < minDistance) {
          minDistance = distance;
          closestStepIndex = index;
        }
      }
    });

    // Calculate remaining distance and time
    let distanceRemaining = 0;
    let timeRemaining = 0;
    
    for (let i = closestStepIndex; i < route.steps.length; i++) {
      distanceRemaining += route.steps[i].distance || 0;
      timeRemaining += route.steps[i].duration || 0;
    }

    const nextInstruction = route.steps[closestStepIndex + 1] || route.steps[closestStepIndex];
    const distanceToNextTurn = nextInstruction ? (nextInstruction.distance || 0) : 0;
    const routeProgress = route.distance > 0 ? 1 - (distanceRemaining / route.distance) : 0;

    return {
      distanceRemaining,
      timeRemaining,
      nextInstruction,
      distanceToNextTurn,
      currentStepIndex: closestStepIndex,
      routeProgress: Math.max(0, Math.min(1, routeProgress)),
    };
  }, [calculateDistance]);

  // Voice guidance functions
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;
    
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85,
      });
      
      logger.log('🗣️ Voice:', text);
    } catch (error) {
      logger.error('Voice guidance error:', error);
    }
  }, [voiceEnabled]);

  const speakDistance = useCallback((instruction: string, distanceMeters: number) => {
    let distanceText = '';
    
    if (distanceMeters < 50) {
      distanceText = 'Now';
    } else if (distanceMeters < 100) {
      distanceText = `In ${Math.round(distanceMeters)} meters`;
    } else if (distanceMeters < 1000) {
      const rounded = Math.round(distanceMeters / 10) * 10;
      distanceText = `In ${rounded} meters`;
    } else {
      const km = (distanceMeters / 1000).toFixed(1);
      distanceText = `In ${km} kilometers`;
    }
    
    speak(`${distanceText}, ${instruction}`);
  }, [speak]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const newValue = !prev;
      speak(newValue ? 'Voice guidance enabled' : 'Voice guidance disabled');
      return newValue;
    });
  }, [speak]);

  // Update progress when location or route changes
  useEffect(() => {
    if (currentRoute && currentLocation && isNavigating) {
      const newProgress = calculateProgress(currentRoute, currentLocation);
      setProgress(newProgress);
      
      // Voice guidance announcements
      if (voiceEnabled && newProgress.nextInstruction && newProgress.nextInstruction.instruction) {
        const instruction = newProgress.nextInstruction.instruction;
        const distance = newProgress.distanceToNextTurn;
        const stepKey = `${newProgress.currentStepIndex}-${instruction}`;

        // Announce at specific distance thresholds
        if (distance > 0 && distance < 500 && distance > 400 && !announcedDistances.current.has(`${stepKey}-500`)) {
          speakDistance(instruction, distance);
          announcedDistances.current.add(`${stepKey}-500`);
        } else if (distance > 0 && distance < 200 && distance > 150 && !announcedDistances.current.has(`${stepKey}-200`)) {
          speakDistance(instruction, distance);
          announcedDistances.current.add(`${stepKey}-200`);
        } else if (distance > 0 && distance < 50 && !announcedDistances.current.has(`${stepKey}-50`)) {
          speakDistance(instruction, distance);
          announcedDistances.current.add(`${stepKey}-50`);
        }

        // Clear old announcements when moving to next step
        if (newProgress.currentStepIndex !== lastAnnouncedStep.current) {
          const keysToKeep = new Set<string>();
          announcedDistances.current.forEach(key => {
            const stepIndex = parseInt(key.split('-')[0]);
            if (stepIndex >= newProgress.currentStepIndex - 1) {
              keysToKeep.add(key);
            }
          });
          announcedDistances.current = keysToKeep;
          lastAnnouncedStep.current = newProgress.currentStepIndex;
        }
      }
    }
  }, [currentLocation, currentRoute, isNavigating, calculateProgress, voiceEnabled, speakDistance]);
  
  // Initialize progress when navigation starts
  useEffect(() => {
    if (currentRoute && isNavigating) {
      setProgress({
        distanceRemaining: currentRoute.distance || 0,
        timeRemaining: currentRoute.duration || 0,
        nextInstruction: currentRoute.steps?.[0] || null,
        distanceToNextTurn: currentRoute.steps?.[0]?.distance || 0,
        currentStepIndex: 0,
        routeProgress: 0,
      });
    }
  }, [currentRoute, isNavigating]);

  // Helper function to extract short destination name (first 2 parts)
  const getShortDestination = useCallback((fullDestination: string): string => {
    if (!fullDestination) return 'your destination';
    
    // Split by comma and take first 2 parts
    const parts = fullDestination.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length >= 2) {
      // Return first 2 parts: "Axis Mall, Biswa Bangla Sarani"
      return `${parts[0]}, ${parts[1]}`;
    } else if (parts.length === 1) {
      // If only one part, return it
      return parts[0];
    }
    
    return fullDestination;
  }, []);

  // Announce route start
  useEffect(() => {
    if (isNavigating && currentRoute && destination && !hasAnnouncedStart.current && voiceEnabled) {
      const minutes = Math.round(currentRoute.duration / 60);
      const km = (currentRoute.distance / 1000).toFixed(1);
      const shortDestination = getShortDestination(destination);
      speak(`Navigation started. ${minutes} minutes to ${shortDestination}, ${km} kilometers.`);
      hasAnnouncedStart.current = true;
    } else if (!isNavigating) {
      hasAnnouncedStart.current = false;
      hasAnnouncedArrival.current = false;
      announcedDistances.current.clear();
      lastAnnouncedStep.current = -1;
    }
  }, [isNavigating, currentRoute, destination, voiceEnabled, speak, getShortDestination]);

  // Announce arrival
  useEffect(() => {
    if (isNavigating && !hasAnnouncedArrival.current && voiceEnabled) {
      if (progress.routeProgress > 0.95 && progress.distanceRemaining < 100) {
        const shortDestination = destination ? getShortDestination(destination) : 'your destination';
        speak(`You have arrived at ${shortDestination}. Navigation complete.`);
        hasAnnouncedArrival.current = true;
      }
    }
  }, [isNavigating, progress.routeProgress, progress.distanceRemaining, destination, voiceEnabled, speak, getShortDestination]);

  // Get transport mode icon
  const getTransportIcon = (mode: string): string => {
    switch (mode) {
      case 'car': return '🚗';
      case 'bike': return '🚴';
      case 'walk': return '🚶';
      default: return '🚗';
    }
  };

  // Get instruction icon based on maneuver
  const getInstructionIcon = (instruction: string): string => {
    if (!instruction) return '↑';
    
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

  const timeRemaining = progress.timeRemaining || currentRoute?.duration || 0;
  const distanceRemaining = progress.distanceRemaining || currentRoute?.distance || 0;
  const nextInstruction = progress.nextInstruction?.instruction || 'Continue on route';
  const distanceToNextTurn = progress.distanceToNextTurn;

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              {formatDuration(timeRemaining)}
            </Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
          <Text style={styles.destinationText} numberOfLines={1}>
            {formatDistance(distanceRemaining)} • {destination || 'destination'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.exitButton} 
          onPress={onExitNavigation}
          activeOpacity={0.7}
        >
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Combined Instruction & Progress Panel */}
      <View style={styles.instructionPanel}>
        <View style={styles.instructionRow}>
          <View style={styles.instructionIcon}>
            <Text style={styles.maneuverIcon}>
              {getInstructionIcon(nextInstruction)}
            </Text>
          </View>
          
          <View style={styles.instructionContent}>
            <Text style={styles.instruction} numberOfLines={2}>
              {nextInstruction}
            </Text>
            <Text style={styles.instructionDistance}>
              {distanceToNextTurn > 0
                ? `in ${formatDistance(distanceToNextTurn)}`
                : 'Following route...'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.max(0, Math.min(100, progress.routeProgress * 100))}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress.routeProgress * 100)}% complete
          </Text>
        </View>
      </View>

      {/* Minimal Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[
            styles.voiceButton,
            voiceEnabled && styles.voiceButtonActive
          ]}
          onPress={toggleVoice}
          activeOpacity={0.7}
        >
          <Text style={styles.voiceIcon}>
            {voiceEnabled ? '🔊' : '🔇'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.transportBadge}>
          <Text style={styles.transportIcon}>{getTransportIcon(transportMode)}</Text>
          <Text style={styles.transportText}>{transportMode}</Text>
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
    zIndex: 1500,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8E6CF',
    letterSpacing: 0.5,
  },
  destinationText: {
    fontSize: 13,
    color: '#E0FFE0',
    fontWeight: '500',
  },
  exitButton: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  exitText: {
    color: '#FF4444',
    fontWeight: '700',
    fontSize: 18,
  },
  instructionPanel: {
    backgroundColor: '#FFFFFF',
    marginLeft: 12,
    marginRight: 16, // Extend to cover zoom buttons (which are at right: 16)
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6, // Higher than zoom buttons (elevation: 5)
    zIndex: 1000, // Higher than zoom buttons (zIndex: 999)
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  maneuverIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  instructionContent: {
    flex: 1,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  instructionDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    zIndex: 1000, // Higher than zoom buttons (999)
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceButtonActive: {
    backgroundColor: '#4CAF50',
  },
  voiceIcon: {
    fontSize: 18,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  transportIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  transportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
});

export default SimpleNavigationUI;
