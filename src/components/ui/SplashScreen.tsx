import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

function ShieldIcon({ size = 72, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        fill={color}
        opacity={0.18}
      />
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in background
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Logo scale + opacity
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.15, duration: 600, useNativeDriver: true }),
      ]),
      // Text reveal
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Hold
      Animated.delay(1200),
      // Exit fade
      Animated.timing(exitOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <Animated.View style={[styles.bg, { opacity: bgOpacity }]} />

      {/* Decorative ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring2,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <ShieldIcon size={52} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>BenefitOS</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
        <Text style={styles.tagline}>Welfare Intelligence Platform</Text>
        <View style={styles.divider} />
        <Text style={styles.subTagline}>Government Scheme Discovery</Text>
      </Animated.View>

      {/* Bottom version */}
      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <Text style={styles.footerText}>Powered by Graph Intelligence</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E3D59',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  bg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E3D59',
  },
  ring: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 60,
    borderColor: '#FFFFFF',
    alignSelf: 'center',
  },
  ring2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 40,
    borderColor: '#FF6E40',
    alignSelf: 'center',
  },
  logoWrap: {
    marginBottom: 28,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#FF6E40',
    borderRadius: 1,
    marginBottom: 12,
  },
  subTagline: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
