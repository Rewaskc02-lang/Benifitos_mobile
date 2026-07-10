import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';

function WifiOffIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 6C3.14 4.13 5.86 3 9 3C12.14 3 14.86 4.13 17 6M5 10C6.46 8.78 8.13 8 10 8M14 8.5C15.57 9.21 16.9 10.33 17.9 11.71" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M10.7 16.7L12 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="20" r="1" fill={color} />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Simple poll-based connectivity check using fetch
async function checkOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch('https://8.8.8.8', { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

export function NetworkBanner() {
  const P = usePalette();
  const [offline, setOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const slideY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const online = await checkOnline();
      if (!mounted) return;

      if (!online && !offline) {
        setOffline(true);
        setWasOffline(true);
        Animated.parallel([
          Animated.timing(slideY, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      } else if (online && offline) {
        setOffline(false);
        // Show "Back online" briefly
        Animated.sequence([
          Animated.delay(1500),
          Animated.parallel([
            Animated.timing(slideY, { toValue: -60, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]).start(() => { if (mounted) setWasOffline(false); });
      }
    };

    const interval = setInterval(poll, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(hideTimer);
    };
  }, [offline, slideY, opacity]);

  if (!wasOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: offline ? P.error : P.success,
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
      accessibilityLiveRegion="assertive"
    >
      {offline ? (
        <>
          <WifiOffIcon color="#FFFFFF" size={14} />
          <Text style={styles.bannerText}>No internet connection</Text>
        </>
      ) : (
        <Text style={styles.bannerText}>Back online</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
