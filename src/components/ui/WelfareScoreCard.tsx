import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Line } from 'react-native-svg';
import type { WelfareScore } from '@/lib/api/services/welfareService';
import { usePalette } from '@/store/themeStore';

const SIZE = 140;
const CENTER = SIZE / 2;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(score: number, P: ReturnType<typeof usePalette>): string {
  if (score >= 70) return P.success;
  if (score >= 40) return P.accent;
  return P.error;
}

function formatINR(amount: number): string {
  if (amount >= 100000) {
    const l = amount / 100000;
    return `\u20B9${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`;
  }
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return `\u20B9${amount}`;
}

function RefreshIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4V10H17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.49 15C19.84 16.94 18.63 18.64 17 19.85C15.37 21.06 13.41 21.73 11.4 21.78C9.39 21.83 7.4 21.27 5.72 20.16C4.03 19.06 2.73 17.46 2.01 15.59L1 13M1 20V14H7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendUpIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6H23V12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface WelfareScoreCardProps {
  data: WelfareScore | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function WelfareScoreCard({ data, isLoading, error, onRetry }: WelfareScoreCardProps) {
  const P = usePalette();
  const color = data ? ringColor(data.score, P) : P.primary;
  const dashOffset = data ? CIRCUMFERENCE * (1 - data.score / 100) : CIRCUMFERENCE;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: P.surface,
          borderColor: P.border,
          shadowColor: P.shadow,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.cardHeader, { borderBottomColor: P.border }]}>
        <Text style={[styles.cardHeaderText, { color: P.textMuted }]}>YOUR BENEFITS OVERVIEW</Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {isLoading ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator color={P.primary} size="large" />
            <Text style={[styles.loadingText, { color: P.textSecondary }]}>Loading your score...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredLoader}>
            <Text style={[styles.errorText, { color: P.error }]}>{error}</Text>
            <TouchableOpacity
              onPress={onRetry}
              style={[styles.retryBtn, { backgroundColor: P.primary }]}
              activeOpacity={0.8}
            >
              <RefreshIcon color={P.white} />
              <Text style={[styles.retryBtnText, { color: P.white }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <>
            <View style={styles.ringRow}>
              {/* Ring */}
              <View style={{ position: 'relative', width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE}>
                  <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={P.borderLight} strokeWidth={STROKE} fill="none" />
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
                <View style={styles.ringLabel}>
                  <Text style={[styles.ringScore, { color: P.textPrimary }]}>{data.score}%</Text>
                  <Text style={[styles.ringSubLabel, { color: P.textMuted }]}>Welfare Score</Text>
                </View>
              </View>

              {/* Benefit tiles */}
              <View style={{ flex: 1, paddingLeft: 20, gap: 10 }}>
                <View style={[styles.benefitTile, { backgroundColor: P.background, borderColor: P.border }]}>
                  <Text style={[styles.tileLabel, { color: P.textMuted }]}>CURRENT</Text>
                  <Text style={[styles.tileValue, { color: P.success }]}>{formatINR(data.currentBenefits)}</Text>
                  <Text style={[styles.tileSub, { color: P.textMuted }]}>
                    {'\u20B9'}{data.currentBenefits.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.benefitTile, { backgroundColor: P.background, borderColor: P.primaryA30 }]}>
                  <Text style={[styles.tileLabel, { color: P.textMuted }]}>POTENTIAL</Text>
                  <Text style={[styles.tileValue, { color: P.primary }]}>{formatINR(data.potentialBenefits)}</Text>
                  <Text style={[styles.tileSub, { color: P.textMuted }]}>
                    {'\u20B9'}{data.potentialBenefits.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {data.potentialBenefits > data.currentBenefits && (
              <View style={[styles.hint, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
                <TrendUpIcon color={P.primary} />
                <Text style={[styles.hintText, { color: P.textSecondary }]}>
                  Unlock{' '}
                  <Text style={{ color: P.primary, fontWeight: '700' }}>
                    {formatINR(data.potentialBenefits - data.currentBenefits)}
                  </Text>{' '}
                  more in unclaimed government benefits
                </Text>
              </View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  cardHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardBody: {
    padding: 20,
  },
  centeredLoader: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ringLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  ringSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  benefitTile: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  tileSub: {
    fontSize: 11,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
