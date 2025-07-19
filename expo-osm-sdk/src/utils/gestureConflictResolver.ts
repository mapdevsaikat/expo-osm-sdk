/**
 * Gesture Conflict Resolution System
 * 
 * Manages conflicts between different gesture recognizers and provides
 * priority-based resolution for competing gestures.
 */

export interface GestureConflict {
  id: string;
  type: 'map' | 'custom' | 'control';
  priority: number;
  active: boolean;
  timestamp: number;
}

export interface ConflictResolution {
  winnerId: string;
  reason: string;
  conflictingGestures: string[];
}

export class GestureConflictResolver {
  private activeGestures: Map<string, GestureConflict> = new Map();
  private resolutionHistory: ConflictResolution[] = [];
  private priorities: Record<string, number> = {
    'map-pan': 1,
    'map-zoom': 2,
    'map-rotate': 3,
    'map-pitch': 4,
    'control-tap': 5,
    'custom-multi-touch': 6,
    'custom-pattern': 7,
  };

  /**
   * Register a new gesture as active
   */
  registerGesture(gesture: GestureConflict): void {
    this.activeGestures.set(gesture.id, gesture);
    this.resolveConflicts();
  }

  /**
   * Remove a gesture from active list
   */
  unregisterGesture(gestureId: string): void {
    this.activeGestures.delete(gestureId);
  }

  /**
   * Check if a gesture can proceed based on current conflicts
   */
  canProceed(gestureId: string): boolean {
    const gesture = this.activeGestures.get(gestureId);
    if (!gesture) return false;

    // Check for higher priority active gestures
    for (const [id, activeGesture] of this.activeGestures) {
      if (id !== gestureId && activeGesture.active && activeGesture.priority > gesture.priority) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resolve conflicts between competing gestures
   */
  private resolveConflicts(): void {
    const conflicts = this.findConflicts();
    
    for (const conflict of conflicts) {
      const resolution = this.resolveConflict(conflict);
      this.applyResolution(resolution);
      this.resolutionHistory.push(resolution);
    }

    // Clean up old history
    this.cleanupHistory();
  }

  /**
   * Find conflicting gestures
   */
  private findConflicts(): string[][] {
    const conflicts: string[][] = [];
    const activeIds = Array.from(this.activeGestures.keys());

    // Check for simultaneous gestures that might conflict
    for (let i = 0; i < activeIds.length; i++) {
      for (let j = i + 1; j < activeIds.length; j++) {
        const id1 = activeIds[i];
        const id2 = activeIds[j];
        if (!id1 || !id2) continue;
        
        const gesture1 = this.activeGestures.get(id1);
        const gesture2 = this.activeGestures.get(id2);

        if (gesture1 && gesture2 && this.areConflicting(gesture1, gesture2)) {
          conflicts.push([id1, id2]);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two gestures are conflicting
   */
  private areConflicting(gesture1: GestureConflict, gesture2: GestureConflict): boolean {
    // Same type gestures conflict
    if (gesture1.type === gesture2.type) return true;

    // Map gestures conflict with each other
    if (gesture1.type === 'map' && gesture2.type === 'map') return true;

    // Custom gestures might conflict with map gestures
    if (gesture1.type === 'custom' && gesture2.type === 'map') return true;
    if (gesture1.type === 'map' && gesture2.type === 'custom') return true;

    // Time-based conflict (too close in time)
    const timeDiff = Math.abs(gesture1.timestamp - gesture2.timestamp);
    return timeDiff < 100; // 100ms threshold
  }

  /**
   * Resolve a specific conflict
   */
  private resolveConflict(conflictingIds: string[]): ConflictResolution {
    const gestures = conflictingIds.map(id => this.activeGestures.get(id)).filter(Boolean);
    
    if (gestures.length === 0) {
      return {
        winnerId: '',
        reason: 'No valid gestures found',
        conflictingGestures: conflictingIds,
      };
    }

    // Sort by priority (higher number = higher priority)
    gestures.sort((a, b) => b!.priority - a!.priority);
    
    const winner = gestures[0]!;
    
    return {
      winnerId: winner.id,
      reason: `Higher priority (${winner.priority})`,
      conflictingGestures: conflictingIds,
    };
  }

  /**
   * Apply conflict resolution
   */
  private applyResolution(resolution: ConflictResolution): void {
    // Deactivate losing gestures
    for (const gestureId of resolution.conflictingGestures) {
      if (gestureId !== resolution.winnerId) {
        const gesture = this.activeGestures.get(gestureId);
        if (gesture) {
          gesture.active = false;
        }
      }
    }
  }

  /**
   * Clean up old resolution history
   */
  private cleanupHistory(): void {
    const now = Date.now();
    this.resolutionHistory = this.resolutionHistory.filter(
      resolution => {
        const firstGesture = resolution.conflictingGestures[0];
        return firstGesture && now - firstGesture.length < 5000; // Keep 5 seconds
      }
    );
  }

  /**
   * Get current active gestures
   */
  getActiveGestures(): GestureConflict[] {
    return Array.from(this.activeGestures.values()).filter(g => g.active);
  }

  /**
   * Get resolution history for debugging
   */
  getResolutionHistory(): ConflictResolution[] {
    return [...this.resolutionHistory];
  }

  /**
   * Set custom priority for a gesture type
   */
  setPriority(gestureType: string, priority: number): void {
    this.priorities[gestureType] = priority;
  }

  /**
   * Get priority for a gesture type
   */
  getPriority(gestureType: string): number {
    return this.priorities[gestureType] || 0;
  }

  /**
   * Clear all active gestures
   */
  clearAll(): void {
    this.activeGestures.clear();
  }
}

/**
 * Singleton instance for global gesture conflict resolution
 */
export const gestureConflictResolver = new GestureConflictResolver(); 