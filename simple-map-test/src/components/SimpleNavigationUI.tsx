import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { type Route, type Coordinate, type RouteStep } from 'expo-osm-sdk';
import * as Speech from 'expo-speech';

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

    // Find closest point on route (simplified but more robust)
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
      
      // Debug log to verify updates
      console.log('📊 Navigation Progress:', {
        distanceRemaining: Math.round(newProgress.distanceRemaining),
        timeRemaining: Math.round(newProgress.timeRemaining / 60),
        progress: Math.round(newProgress.routeProgress * 100),
        stepIndex: newProgress.currentStepIndex,
      });

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
          // Keep only recent announcements (last 2 steps)
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

  // Announce route start
  useEffect(() => {
    if (isNavigating && currentRoute && destination && !hasAnnouncedStart.current && voiceEnabled) {
      const minutes = Math.round(currentRoute.duration / 60);
      const km = (currentRoute.distance / 1000).toFixed(1);
      speak(`Navigation started. ${minutes} minutes to ${destination}, ${km} kilometers.`);
      hasAnnouncedStart.current = true;
    } else if (!isNavigating) {
      hasAnnouncedStart.current = false;
      hasAnnouncedArrival.current = false;
      announcedDistances.current.clear();
      lastAnnouncedStep.current = -1;
    }
  }, [isNavigating, currentRoute, destination, voiceEnabled, speak]);

  // Announce arrival
  useEffect(() => {
    if (isNavigating && !hasAnnouncedArrival.current && voiceEnabled) {
      if (progress.routeProgress > 0.95 && progress.distanceRemaining < 100) {
        speak(`You have arrived at ${destination || 'your destination'}. Navigation complete.`);
        hasAnnouncedArrival.current = true;
      }
    }
  }, [isNavigating, progress.routeProgress, progress.distanceRemaining, destination, voiceEnabled, speak]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0 min';
    
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
    if (!meters || meters <= 0) return '0 m';
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Voice guidance functions
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;
    
    try {
      // Stop any ongoing speech
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      
      // Speak the text
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85, // Slightly slower for clarity
      });
      
      console.log('🗣️ Voice:', text);
    } catch (error) {
      console.error('Voice guidance error:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(progress.timeRemaining || currentRoute?.duration || 0)}
            </Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.distanceText}>
              {formatDistance(progress.distanceRemaining || currentRoute?.distance || 0)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.destinationText} numberOfLines={1}>
              {destination || 'destination'}
            </Text>
          </View>
          <View style={styles.progressIndicator}>
            <View style={styles.progressDot} />
            <Text style={styles.progressText}>
              {Math.round((progress.routeProgress || 0) * 100)}% complete
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.exitButton} 
          onPress={onExitNavigation}
          activeOpacity={0.7}
        >
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Turn-by-turn Instructions */}
      <View style={styles.instructionPanel}>
        <View style={styles.instructionContent}>
          <View style={styles.instructionIcon}>
            <Text style={styles.maneuverIcon}>
              {progress.nextInstruction && progress.nextInstruction.instruction
                ? getInstructionIcon(progress.nextInstruction.instruction)
                : '↑'}
            </Text>
          </View>
          
          <View style={styles.instructionText}>
            <Text style={styles.instruction} numberOfLines={2}>
              {progress.nextInstruction && progress.nextInstruction.instruction
                ? progress.nextInstruction.instruction
                : 'Continue on route'}
            </Text>
            <Text style={styles.instructionDistance}>
              {progress.distanceToNextTurn > 0
                ? `in ${formatDistance(progress.distanceToNextTurn)}`
                : 'Following route...'}
            </Text>
          </View>
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
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[
            styles.voiceButton,
            { backgroundColor: voiceEnabled ? '#4CAF50' : '#E0E0E0' }
          ]}
          onPress={toggleVoice}
        >
          <Text style={styles.voiceIcon}>
            {voiceEnabled ? '🔊' : '🔇'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.centerInfo}>
          <Text style={styles.transportMode}>
            {getTransportIcon(transportMode)} {transportMode} Navigation
          </Text>
        </View>
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
    zIndex: 1500, // Higher z-index to ensure it's above the map
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
    marginRight: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  timeText: {
    fontSize: SCREEN_WIDTH > 400 ? 32 : 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8E6CF',
    letterSpacing: 1,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distanceText: {
    fontSize: SCREEN_WIDTH > 400 ? 15 : 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: '#A8E6CF',
    marginHorizontal: 8,
  },
  destinationText: {
    fontSize: SCREEN_WIDTH > 400 ? 15 : 13,
    color: '#E0FFE0',
    flex: 1,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#A8E6CF',
    fontWeight: '500',
  },
  exitButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  exitText: {
    color: '#FF4444',
    fontWeight: '700',
    fontSize: 22,
  },
  instructionPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
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
    borderRadius: 2,
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
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  voiceIcon: {
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

export default SimpleNavigationUI; 