import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

// ─── Persistence ────────────────────────────────────────────────────────────
// Bump ONBOARDING_VERSION to re-show the tour after a content change (e.g. a
// new feature worth walking testers through) without affecting other flags.
// A plain marker file (via expo-file-system, already a dependency for GPX
// export) avoids pulling in AsyncStorage just for one boolean.

const ONBOARDING_VERSION = 'v1';
const onboardingFlagFile = new FileSystem.File(
  FileSystem.Paths.document,
  `.onboarding-${ONBOARDING_VERSION}-seen`,
);

export function hasSeenOnboarding(): boolean {
  try {
    return onboardingFlagFile.exists;
  } catch {
    // If the check itself fails, don't block the app on an onboarding modal.
    return true;
  }
}

export function markOnboardingSeen(): void {
  try {
    if (!onboardingFlagFile.exists) {
      onboardingFlagFile.write('1');
    }
  } catch {
    // Non-critical — worst case the tour reappears next launch.
  }
}

// ─── Content ─────────────────────────────────────────────────────────────────

type Slide = {
  kicker: string;
  headline: string;
  body: string;
  accent: string;
  backdrop: string;
};

const SLIDES: Slide[] = [
  {
    kicker: '01 · WHAT IS THIS',
    headline: 'A living demo,\nnot a product.',
    body: 'This app showcases expo-osm-sdk — a free, open-source OpenStreetMap component for Expo & React Native. Everything here exists to explore what the SDK can do.',
    accent: '#C79CFF',
    backdrop: '#140B1F',
  },
  {
    kicker: '02 · EXPLORE',
    headline: 'Four tabs,\none map engine.',
    body: 'Markers & tile styles, shape overlays, route drawing, and live location — all running on the same native MapLibre view underneath.',
    accent: '#5EB0FF',
    backdrop: '#05121F',
  },
  {
    kicker: '03 · GO LIVE',
    headline: 'Track your\nmovement, live.',
    body: 'Start tracking on the Location tab to watch your GPS position, altitude, accuracy, and bearing update in real time.',
    accent: '#5BE38A',
    backdrop: '#07160F',
  },
  {
    kicker: '04 · YOUR DATA',
    headline: 'Download your track.\nNothing else leaves.',
    body: '"Download Track" exports your recorded path as a GPX file — the only reason this demo ever asks for storage access. No servers, no analytics, nothing uploaded.',
    accent: '#FFC24D',
    backdrop: '#1A1207',
  },
];

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

// ─── Component ───────────────────────────────────────────────────────────────

interface OnboardingProps {
  visible: boolean;
  onDismiss: () => void;
}

export function Onboarding({ visible, onDismiss }: OnboardingProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  // One staggered entrance per visit, not per swipe — keeps the interaction
  // simple while still giving the tour a designed, non-instant arrival.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      enter.setValue(0);
      Animated.timing(enter, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, enter]);

  const goToIndex = useCallback((next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }, [width]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  }, [width]);

  const isLast = index === SLIDES.length - 1;
  const active = SLIDES[index];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <SafeAreaProvider>
        <View style={[styles.root, { backgroundColor: active.backdrop }]}>
          <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <TouchableOpacity
              style={styles.skip}
              onPress={onDismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip introduction"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumEnd}
              style={styles.scroll}
            >
              {SLIDES.map((slide) => (
                <View key={slide.kicker} style={[styles.slide, { width }]}>
                  <Animated.View
                    style={[
                      styles.slideInner,
                      {
                        opacity: enter,
                        transform: [
                          {
                            translateY: enter.interpolate({
                              inputRange: [0, 1],
                              outputRange: [18, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.ringWrap}>
                      <View style={[styles.ring, styles.ringOuter, { borderColor: `${slide.accent}33` }]} />
                      <View style={[styles.ring, styles.ringMid, { borderColor: `${slide.accent}66` }]} />
                      <View style={[styles.ring, styles.ringInner, { backgroundColor: slide.accent }]} />
                    </View>

                    <Text style={[styles.kicker, { color: slide.accent }]}>{slide.kicker}</Text>
                    <Text style={styles.headline}>{slide.headline}</Text>
                    <Text style={styles.body}>{slide.body}</Text>
                  </Animated.View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.dots}>
                {SLIDES.map((slide, i) => (
                  <View
                    key={slide.kicker}
                    style={[
                      styles.dot,
                      i === index && { backgroundColor: active.accent, width: 20 },
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.cta, { backgroundColor: active.accent }]}
                activeOpacity={0.85}
                onPress={() => (isLast ? onDismiss() : goToIndex(index + 1))}
                accessibilityRole="button"
                accessibilityLabel={isLast ? 'Get started' : 'Next'}
              >
                <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const RING_SIZE = 104;
const RING_MID_SIZE = 70;
const RING_DOT_SIZE = 14;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.55)',
  },
  scroll: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  slideInner: {
    paddingHorizontal: 28,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
  },
  ringMid: {
    width: RING_MID_SIZE,
    height: RING_MID_SIZE,
    borderRadius: RING_MID_SIZE / 2,
    borderWidth: 1.5,
    top: (RING_SIZE - RING_MID_SIZE) / 2,
    left: (RING_SIZE - RING_MID_SIZE) / 2,
  },
  ringInner: {
    width: RING_DOT_SIZE,
    height: RING_DOT_SIZE,
    borderRadius: RING_DOT_SIZE / 2,
    top: (RING_SIZE - RING_DOT_SIZE) / 2,
    left: (RING_SIZE - RING_DOT_SIZE) / 2,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
    fontFamily: MONO_FONT,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.68)',
    maxWidth: 340,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cta: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 28,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B0B10',
  },
});
