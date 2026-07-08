import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { WelfareScore } from '@/lib/api/services/welfareService';
import { Palette } from '@/constants/theme';
import { SkeletonLoader } from './SkeletonLoader';

// ---------------------------------------------------------------------------
// Ring constants
// ---------------------------------------------------------------------------
const SIZE = 140;        // SVG canvas size
const CENTER = SIZE / 2; // 70
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2; // 65
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 408.4

function ringColor(score: number): string {
  if (score >= 70) return Palette.success;
  if (score >= 40) return Palette.primary;
  return Palette.error;
}

function formatINR(amount: number): string {
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
  }
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

// ---------------------------------------------------------------------------
// Subcomponent — the SVG ring
// ---------------------------------------------------------------------------
function ScoreRing({ score }: { score: number }) {
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const color = ringColor(score);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background track */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={Palette.border}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress arc — rotated so it starts at 12 o'clock */}
        <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Score label — absolutely centered over the SVG */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: Palette.textPrimary, fontSize: 28, fontWeight: '800', lineHeight: 32 }}>
          {score}%
        </Text>
        <Text style={{ color: Palette.textMuted, fontSize: 11, marginTop: 2 }}>Welfare Score</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

interface WelfareScoreCardProps {
  data: WelfareScore | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function WelfareScoreCard({
  data,
  isLoading,
  error,
  onRetry,
}: WelfareScoreCardProps) {
  return (
    <View
      style={{
        marginHorizontal: 24,
        borderRadius: 24,
        backgroundColor: Palette.surface,
        borderWidth: 1,
        borderColor: Palette.border,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: Palette.border,
        }}
      >
        <Text
          style={{
            color: Palette.textSecondary,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          Your Benefits Overview
        </Text>
      </View>

      {/* Card body */}
      <View style={{ padding: 20 }}>
        {isLoading ? (
          <View style={{ gap: 12, paddingVertical: 10 }}>
            <SkeletonLoader height={24} width="40%" />
            <SkeletonLoader height={72} width="100%" borderRadius={16} />
            <SkeletonLoader height={48} width="100%" borderRadius={12} />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ color: Palette.error, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={onRetry}
              style={{
                backgroundColor: Palette.primary,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 14,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: Palette.white, fontWeight: '600', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <>
            {/* Ring — centered */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <ScoreRing score={data.score} />
            </View>

            {/* Benefits row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Current Benefits */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: Palette.background,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: Palette.border,
                }}
              >
                <Text
                  style={{
                    color: Palette.textMuted,
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Current Benefits
                </Text>
                <Text style={{ color: Palette.textPrimary, fontSize: 20, fontWeight: '700' }}>
                  {formatINR(data.currentBenefits)}
                </Text>
                <Text style={{ color: Palette.textSecondary, fontSize: 11, marginTop: 2 }}>
                  ₹{data.currentBenefits.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Potential Benefits */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: Palette.background,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: Palette.primaryA44,
                }}
              >
                <Text
                  style={{
                    color: Palette.textMuted,
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Potential Benefits
                </Text>
                <Text style={{ color: Palette.secondary, fontSize: 20, fontWeight: '700' }}>
                  {formatINR(data.potentialBenefits)}
                </Text>
                <Text style={{ color: Palette.textSecondary, fontSize: 11, marginTop: 2 }}>
                  ₹{data.potentialBenefits.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Unlockable hint */}
            {data.potentialBenefits > data.currentBenefits && (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  backgroundColor: Palette.primaryA14,
                  borderWidth: 1,
                  borderColor: Palette.primaryA33,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 10 }}>💡</Text>
                <Text style={{ color: Palette.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 }}>
                  You could unlock{' '}
                  <Text style={{ color: Palette.primary, fontWeight: '700' }}>
                    {formatINR(data.potentialBenefits - data.currentBenefits)}
                  </Text>{' '}
                  more in government schemes.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}
