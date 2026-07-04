import { Platform, StyleSheet, ViewStyle } from 'react-native';
import type { MapControlTheme } from '../types';

/** Shared palette for map overlay controls (NavigationControls, LocationButton). */
export const MAP_CONTROL_COLORS = {
  accent: '#9C1AFF',
  icon: '#48484A',
  iconMuted: '#AEAEB2',
  background: 'rgba(255, 255, 255, 0.96)',
  divider: '#E5E5EA',
  pressed: '#F2F2F7',
  border: 'rgba(0, 0, 0, 0.08)',
} as const;

/** Default touch target — Apple HIG minimum (44pt). */
export const MAP_CONTROL_DEFAULT_SIZE = 44;

/** Compact touch target — ~36pt, opt-in via `compact` prop. */
export const MAP_CONTROL_COMPACT_SIZE = 36;

export interface ResolvedMapControlTheme {
  accent: string;
  icon: string;
  iconMuted: string;
  background: string;
  divider: string;
  border: string;
  pressed: string;
}

export interface MapControlThemeInput {
  theme?: MapControlTheme | undefined;
  color?: string | undefined;
  iconColor?: string | undefined;
  iconMutedColor?: string | undefined;
  backgroundColor?: string | undefined;
  borderColor?: string | undefined;
  activeBackgroundColor?: string | undefined;
}

export interface MapControlMetrics {
  cellSize: number;
  borderRadius: number;
  iconFrame: number;
  plusBarWidth: number;
  plusBarLength: number;
  minusLength: number;
  compassSize: number;
  compassRingSize: number;
  compassBorderWidth: number;
  compassNeedleNorth: { borderLeft: number; borderRight: number; borderBottom: number };
  compassNeedleSouth: { borderLeft: number; borderRight: number; borderTop: number };
  compassCenter: number;
  chevronHalf: number;
  chevronHeight: number;
  locationRingSize: number;
  locationDotSize: number;
  shadow: ViewStyle;
}

export function resolveMapControlSize(compact?: boolean | undefined, size?: number | undefined): number {
  if (size !== undefined) return size;
  return compact ? MAP_CONTROL_COMPACT_SIZE : MAP_CONTROL_DEFAULT_SIZE;
}

export function resolveMapControlTheme(input: MapControlThemeInput): ResolvedMapControlTheme {
  const { theme, color, iconColor, iconMutedColor, backgroundColor, borderColor, activeBackgroundColor } = input;
  return {
    accent: theme?.accent ?? color ?? MAP_CONTROL_COLORS.accent,
    icon: theme?.icon ?? iconColor ?? MAP_CONTROL_COLORS.icon,
    iconMuted: theme?.iconMuted ?? iconMutedColor ?? MAP_CONTROL_COLORS.iconMuted,
    background: theme?.background ?? backgroundColor ?? MAP_CONTROL_COLORS.background,
    divider: theme?.divider ?? borderColor ?? MAP_CONTROL_COLORS.divider,
    border: theme?.border ?? borderColor ?? MAP_CONTROL_COLORS.border,
    pressed: theme?.pressed ?? activeBackgroundColor ?? MAP_CONTROL_COLORS.pressed,
  };
}

/** Returns accent tint for active states (e.g. 3D pitch row). */
export function mapControlActiveTint(accent: string, pressed?: string): string {
  if (pressed && pressed !== MAP_CONTROL_COLORS.pressed) return pressed;
  return `${accent}12`;
}

export function getMapControlMetrics(cellSize: number): MapControlMetrics {
  const isCompact = cellSize <= MAP_CONTROL_COMPACT_SIZE;
  const scale = cellSize / MAP_CONTROL_DEFAULT_SIZE;

  return {
    cellSize,
    borderRadius: isCompact ? 9 : 12,
    iconFrame: Math.round(20 * scale),
    plusBarWidth: isCompact ? 1.5 : 2,
    plusBarLength: isCompact ? 11 : 14,
    minusLength: isCompact ? 11 : 14,
    compassSize: Math.round(22 * scale),
    compassRingSize: Math.round(20 * scale),
    compassBorderWidth: isCompact ? 1.25 : 1.5,
    compassNeedleNorth: isCompact
      ? { borderLeft: 3, borderRight: 3, borderBottom: 5.5 }
      : { borderLeft: 3.5, borderRight: 3.5, borderBottom: 7 },
    compassNeedleSouth: isCompact
      ? { borderLeft: 2.5, borderRight: 2.5, borderTop: 4 }
      : { borderLeft: 3, borderRight: 3, borderTop: 5 },
    compassCenter: isCompact ? 2.5 : 3,
    chevronHalf: isCompact ? 4 : 5,
    chevronHeight: isCompact ? 5 : 6,
    locationRingSize: Math.round(20 * scale),
    locationDotSize: isCompact ? 5 : 6,
    shadow: isCompact ? mapControlShadowCompact : mapControlShadow,
  };
}

const mapControlShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
}) ?? {};

const mapControlShadowCompact = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 3,
  },
}) ?? {};

export function mapControlCardStyle(
  width: number,
  theme: Pick<ResolvedMapControlTheme, 'background' | 'border'>,
  metrics: Pick<MapControlMetrics, 'borderRadius' | 'shadow'>,
): ViewStyle {
  return {
    width,
    backgroundColor: theme.background,
    borderRadius: metrics.borderRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    overflow: 'hidden',
    ...metrics.shadow,
  };
}
