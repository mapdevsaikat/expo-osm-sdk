import { useCallback, useState, useRef, useMemo } from 'react';
import { Platform } from 'react-native';

// Conditional imports with error handling
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (error) {
  console.warn('expo-av not available, audio features will be limited');
}

// You can also use expo-speech for TTS
// import * as Speech from 'expo-speech';

interface VoiceGuidanceOptions {
  enabled: boolean;
  volume: number; // 0-1
  pitch: number; // 0-2
  rate: number; // 0-1
  language: string;
}

export const useVoiceGuidance = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [options, setOptions] = useState<VoiceGuidanceOptions>({
    enabled: true,
    volume: 1.0,
    pitch: 1.0,
    rate: 0.8,
    language: 'en-US',
  });
  
  const lastSpokenInstruction = useRef<string>('');
  const speakTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastRouteAnnouncement = useRef<string>('');

  // Initialize audio mode for navigation
  const initializeAudio = useCallback(async () => {
    try {
      if (Audio && Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: Audio.InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.warn('Failed to initialize audio for navigation:', error);
    }
  }, []);

  // Speak instruction using TTS
  const speakInstruction = useCallback(async (instruction: string, priority: 'normal' | 'high' = 'normal') => {
    if (!options.enabled || !instruction.trim()) {
      return;
    }

    // Avoid repeating the same instruction
    if (lastSpokenInstruction.current === instruction && priority === 'normal') {
      return;
    }

    try {
      // Clear any pending speech
      if (speakTimeout.current) {
        clearTimeout(speakTimeout.current);
      }

      // You can use either expo-speech or expo-av for TTS
      // Option 1: Using expo-speech (simpler, but requires installation)
      /*
      if (Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
      
      await Speech.speak(instruction, {
        language: options.language,
        pitch: options.pitch,
        rate: options.rate,
        volume: options.volume,
      });
      */

      // Option 2: Using console.log for now (replace with actual TTS)
      console.log('🗣️ Voice Guidance:', instruction);
      
      // For demo purposes, you could show a toast or notification
      // You can replace this with actual TTS implementation
      
      lastSpokenInstruction.current = instruction;
      
      // Add a timeout to prevent spam
      speakTimeout.current = setTimeout(() => {
        lastSpokenInstruction.current = '';
      }, 5000);
      
    } catch (error) {
      console.error('Voice guidance failed:', error);
    }
  }, [options]);

  // Speak distance-based instructions
  const speakDistanceInstruction = useCallback((instruction: string, distanceMeters: number) => {
    let distanceText = '';
    
    if (distanceMeters < 50) {
      distanceText = 'Now';
    } else if (distanceMeters < 100) {
      distanceText = `In ${Math.round(distanceMeters)} meters`;
    } else if (distanceMeters < 1000) {
      distanceText = `In ${Math.round(distanceMeters / 10) * 10} meters`;
    } else {
      const km = Math.round(distanceMeters / 100) / 10;
      distanceText = `In ${km} kilometers`;
    }
    
    const fullInstruction = `${distanceText}, ${instruction}`;
    speakInstruction(fullInstruction);
  }, [speakInstruction]);

  // Announce route information
  const announceRoute = useCallback((duration: number, distance: number, destination: string) => {
    const minutes = Math.round(duration / 60);
    const km = Math.round(distance / 100) / 10;
    
    const announcement = `Route calculated. ${minutes} minutes to ${destination}, covering ${km} kilometers. Navigation starting.`;
    
    // Prevent repeated announcements
    if (lastRouteAnnouncement.current === announcement) {
      return;
    }
    
    lastRouteAnnouncement.current = announcement;
    speakInstruction(announcement, 'high');
    
    // Clear the announcement cache after 10 seconds
    setTimeout(() => {
      lastRouteAnnouncement.current = '';
    }, 10000);
  }, [speakInstruction]);

  // Announce arrival
  const announceArrival = useCallback((destination: string) => {
    const announcement = `You have arrived at ${destination}. Navigation complete.`;
    speakInstruction(announcement, 'high');
  }, [speakInstruction]);

  // Update voice settings
  const updateOptions = useCallback((newOptions: Partial<VoiceGuidanceOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Toggle voice guidance
  const toggleVoiceGuidance = useCallback(() => {
    setIsEnabled(prev => !prev);
    setOptions(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  // Memoize the return object to prevent re-creation
  const returnValue = useMemo(() => ({
    // State
    isEnabled,
    options,
    
    // Actions
    speakInstruction,
    speakDistanceInstruction,
    announceRoute,
    announceArrival,
    initializeAudio,
    
    // Settings
    updateOptions,
    toggleVoiceGuidance,
  }), [
    isEnabled,
    options,
    speakInstruction,
    speakDistanceInstruction, 
    announceRoute,
    announceArrival,
    initializeAudio,
    updateOptions,
    toggleVoiceGuidance
  ]);

  return returnValue;
}; 