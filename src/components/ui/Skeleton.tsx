import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { usePalette } from '@/store/themeStore';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const P = usePalette();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: P.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  rows?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ rows = 3, style }: SkeletonCardProps) {
  const P = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: P.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: P.border,
          padding: 20,
        },
        style,
      ]}
    >
      <Skeleton height={18} width="60%" borderRadius={9} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === rows - 1 ? '45%' : '100%'}
          borderRadius={6}
          style={{ marginBottom: 10 }}
        />
      ))}
    </View>
  );
}
