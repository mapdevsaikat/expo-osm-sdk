import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface OSMErrorBoundaryProps {
  children: React.ReactNode;
  /** Called when an error is caught. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Custom fallback UI. Receives the caught error and a retry callback. */
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface OSMErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary for map components.
 *
 * Wrap OSMView (or any part of your map UI) with OSMErrorBoundary to
 * guarantee that a map failure renders a fallback instead of unmounting
 * the host app's React tree.
 *
 * ```tsx
 * <OSMErrorBoundary onError={reportToSentry}>
 *   <OSMView initialCenter={center} initialZoom={12} />
 * </OSMErrorBoundary>
 * ```
 */
export class OSMErrorBoundary extends React.Component<OSMErrorBoundaryProps, OSMErrorBoundaryState> {
  override state: OSMErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): OSMErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('expo-osm-sdk: map component crashed:', error.message);
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // user onError handler threw; nothing more we can do
    }
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.retry);
      }
      return (
        <View style={styles.container} testID="osm-error-boundary-fallback">
          <Text style={styles.title}>Map unavailable</Text>
          <Text style={styles.message}>{error.message}</Text>
          <Text style={styles.hint} onPress={this.retry}>
            Tap here to try again
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    color: '#0c5460',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default OSMErrorBoundary;
