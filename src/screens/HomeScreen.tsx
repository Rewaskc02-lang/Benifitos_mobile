import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useAuthStore } from '@/store/authStore';
import { useWelfareScore } from '@/hooks/useWelfareScore';
import { useMissedBenefits } from '@/hooks/useMissedBenefits';
import { BottomTabParamList } from '@/navigation/RootNavigator';
import { usePalette } from '@/store/themeStore';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Elevation } from '@/constants/theme';
import { NotificationCenter } from '@/screens/NotificationCenter';
import { GlobalSearch } from '@/screens/GlobalSearch';
import { DocumentVault } from '@/screens/DocumentVault';
import { EligibilityScreen } from '@/screens/EligibilityScreen';
import { WelfareSimulator } from '@/screens/WelfareSimulator';

const { width } = Dimensions.get('window');
const CITIZEN_ID_FALLBACK = 'citizen_101';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;
type OverlayScreen = 'notifications' | 'search' | 'vault' | 'eligibility' | 'simulator' | null;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function TrendUpIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17 6 23 6 23 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1" fill={color} />
    </Svg>
  );
}

function MapIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6L8 3L16 7L21 4V18L16 21L8 17L3 20V6Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8" y1="3" x2="8" y2="17" stroke={color} strokeWidth={1.8} />
      <Line x1="16" y1="7" x2="16" y2="21" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function MessageSquareIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15C21 16.1 20.1 17 19 17H7L3 21V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V15Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function GridIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function RefreshIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4V10H17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 20V14H7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.51 9C4.16 7.06 5.37 5.36 7 4.15C8.63 2.94 10.59 2.27 12.6 2.22C14.61 2.17 16.6 2.73 18.28 3.84C19.97 4.94 21.27 6.54 21.99 8.41L23 11M1 13L2.01 15.59C2.73 17.46 4.03 19.06 5.72 20.16C7.4 21.27 9.39 21.83 11.4 21.78C13.41 21.73 15.37 21.06 17 19.85C18.63 18.64 19.84 16.94 20.49 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8C18 6.4 17.4 4.8 16.2 3.6C15 2.4 13.5 2 12 2C10.5 2 9 2.4 7.8 3.6C6.6 4.8 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.7 21C13.5 21.3 13.3 21.6 12.9 21.8C12.5 22 12.3 22 12 22C11.7 22 11.5 22 11.1 21.8C10.7 21.6 10.5 21.3 10.3 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} />
      <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function FileIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6C5.46 2 4.94 2.21 4.59 2.59C4.21 2.94 4 3.46 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Score ring
// ---------------------------------------------------------------------------

const RING_SIZE = 120;
const RING_CENTER = RING_SIZE / 2;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function WelfareRing({ score, color }: { score: number; color: string }) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - score / 100);
  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS} stroke="#E2D9C4" strokeWidth={RING_STROKE} fill="none" />
      <Circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_RADIUS}
        stroke={color}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
      />
    </Svg>
  );
}

function WelfareCardSkeleton({ P }: { P: ReturnType<typeof usePalette> }) {
  return (
    <View style={[styles.welfareCard, { backgroundColor: P.surface, borderColor: P.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginRight: 20 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="75%" height={28} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width="48%" height={60} borderRadius={10} />
        <Skeleton width="48%" height={60} borderRadius={10} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { user } = useAuthStore();
  const P = usePalette();
  const citizenId = user?.id ?? CITIZEN_ID_FALLBACK;
  const [overlay, setOverlay] = useState<OverlayScreen>(null);

  const { data, isLoading, error, refetch } = useWelfareScore(citizenId);
  const { data: missedData, isLoading: missedLoading } = useMissedBenefits(citizenId);

  const scoreColor = data
    ? data.score >= 70
      ? P.success
      : data.score >= 40
        ? P.accent
        : P.error
    : P.primary;

  const formatINR = useCallback((n: number) => {
    if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
    return `\u20B9${n}`;
  }, []);

  // Show overlay screens full-screen without tab bar
  if (overlay === 'notifications') return <NotificationCenter onBack={() => setOverlay(null)} />;
  if (overlay === 'search') return <GlobalSearch onBack={() => setOverlay(null)} />;
  if (overlay === 'vault') return <DocumentVault onBack={() => setOverlay(null)} />;
  if (overlay === 'eligibility') return <EligibilityScreen onBack={() => setOverlay(null)} />;
  if (overlay === 'simulator') return <WelfareSimulator onBack={() => setOverlay(null)} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: P.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreeting}>Welcome back</Text>
            <Text style={styles.headerName}>{user?.name ?? 'Citizen'}</Text>
          </View>
          {/* Search */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { borderColor: 'rgba(255,255,255,0.25)' }]}
            onPress={() => setOverlay('search')}
            activeOpacity={0.8}
            accessibilityLabel="Search schemes and FAQs"
          >
            <SearchIcon color="#FFFFFF" size={16} />
          </TouchableOpacity>
          {/* Notifications */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { borderColor: 'rgba(255,255,255,0.25)', marginLeft: 8 }]}
            onPress={() => setOverlay('notifications')}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>

        {/* Welfare Score Card */}
        <View style={styles.section}>
          {isLoading ? (
            <WelfareCardSkeleton P={P} />
          ) : error ? (
            <View style={[styles.welfareCard, { backgroundColor: P.surface, borderColor: P.border }]}>
              <Text style={[styles.errorMsg, { color: P.error }]}>
                Unable to load your welfare score.
              </Text>
              <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { backgroundColor: P.primary }]}>
                <RefreshIcon color={P.white} />
                <Text style={[styles.retryBtnText, { color: P.white }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            <View style={[styles.welfareCard, { backgroundColor: P.surface, borderColor: P.border, ...Elevation.card }]}>
              <View style={styles.welfareTopRow}>
                <View style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
                  <WelfareRing score={data.score} color={scoreColor} />
                  <View style={styles.ringLabel}>
                    <Text style={[styles.ringScore, { color: P.textPrimary }]}>{data.score}%</Text>
                    <Text style={[styles.ringSubLabel, { color: P.textMuted }]}>Score</Text>
                  </View>
                </View>

                <View style={{ flex: 1, paddingLeft: 20 }}>
                  <Text style={[styles.welfareCardTitle, { color: P.textSecondary }]}>
                    Welfare Overview
                  </Text>
                  <View style={[styles.benefitChip, { backgroundColor: P.successA15, borderColor: P.successA30 }]}>
                    <Text style={[styles.benefitChipLabel, { color: P.textMuted }]}>Current</Text>
                    <Text style={[styles.benefitChipValue, { color: P.success }]}>
                      {formatINR(data.currentBenefits)}
                    </Text>
                  </View>
                  <View style={[styles.benefitChip, { backgroundColor: P.accentA15, borderColor: P.accentA40, marginTop: 8 }]}>
                    <Text style={[styles.benefitChipLabel, { color: P.textMuted }]}>Potential</Text>
                    <Text style={[styles.benefitChipValue, { color: P.accent }]}>
                      {formatINR(data.potentialBenefits)}
                    </Text>
                  </View>
                </View>
              </View>

              {data.potentialBenefits > data.currentBenefits && (
                <View style={[styles.unlockBanner, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
                  <TrendUpIcon color={P.primary} size={16} />
                  <Text style={[styles.unlockBannerText, { color: P.textSecondary }]}>
                    Unlock{' '}
                    <Text style={{ color: P.primary, fontWeight: '700' }}>
                      {formatINR(data.potentialBenefits - data.currentBenefits)}
                    </Text>{' '}
                    more in unclaimed government benefits
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Action Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: P.textPrimary, marginBottom: 14 }]}>
            Tools
          </Text>
          <View style={styles.actionGrid}>
            {([
              { label: 'Check Eligibility', icon: <ShieldIcon color={P.primary} />, action: 'eligibility' as OverlayScreen, bg: P.primaryA10, border: P.primaryA30 },
              { label: 'Document Vault', icon: <FileIcon color={P.accent} />, action: 'vault' as OverlayScreen, bg: P.accentA15, border: P.accentA40 },
              { label: 'What-If Simulator', icon: <TrendUpIcon color={P.success} />, action: 'simulator' as OverlayScreen, bg: P.successA15, border: P.successA30 },
            ] as { label: string; icon: React.ReactNode; action: OverlayScreen; bg: string; border: string }[]).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.actionCard, { backgroundColor: P.surface, borderColor: item.border }]}
                activeOpacity={0.75}
                onPress={() => setOverlay(item.action)}
                accessibilityLabel={item.label}
                accessibilityRole="button"
              >
                <View style={[styles.actionIconWrap, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <Text style={[styles.actionLabel, { color: P.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Missed Benefits */}
        {(missedLoading || (missedData?.missedSchemes && missedData.missedSchemes.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: P.textPrimary }]}>Schemes You're Missing</Text>
              {!missedLoading && missedData?.missedSchemes && (
                <View style={[styles.countBadge, { backgroundColor: P.errorA15, borderColor: P.errorA30 }]}>
                  <Text style={[styles.countBadgeText, { color: P.error }]}>
                    {missedData.missedSchemes.length}
                  </Text>
                </View>
              )}
            </View>

            {missedLoading ? (
              <SkeletonCard rows={3} />
            ) : (
              missedData?.missedSchemes.slice(0, 3).map((scheme) => (
                <View
                  key={scheme.id}
                  style={[styles.schemeRow, { backgroundColor: P.surface, borderColor: P.border }]}
                >
                  <View style={[styles.schemeDot, { backgroundColor: P.error }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.schemeName, { color: P.textPrimary }]} numberOfLines={1}>
                      {scheme.name}
                    </Text>
                    <Text style={[styles.schemeReason, { color: P.textSecondary }]} numberOfLines={2}>
                      {scheme.reason}
                    </Text>
                  </View>
                  <View style={[styles.schemeAmount, { backgroundColor: P.successA15, borderColor: P.successA30 }]}>
                    <Text style={[styles.schemeAmountText, { color: P.success }]}>
                      {formatINR(scheme.benefitAmount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quick Navigation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: P.textPrimary, marginBottom: 14 }]}>
            Quick Access
          </Text>
          <View style={styles.quickGrid}>
            {([
              { label: 'Schemes', icon: <GridIcon color={P.primary} />, tab: 'Schemes', bg: P.primaryA10 },
              { label: 'Roadmap', icon: <MapIcon color={P.accent} />, tab: 'Roadmap', bg: P.accentA15 },
              { label: 'Assistant', icon: <MessageSquareIcon color={P.success} />, tab: 'Assistant', bg: P.successA15 },
              { label: 'Profile', icon: <UserIcon color={P.primary} />, tab: 'Profile', bg: P.primaryA10 },
            ] as { label: string; icon: React.ReactNode; tab: keyof BottomTabParamList; bg: string }[]).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.quickCard, { backgroundColor: P.surface, borderColor: P.border }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(item.tab)}
                accessibilityLabel={`Navigate to ${item.label}`}
                accessibilityRole="button"
              >
                <View style={[styles.quickIconWrap, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <Text style={[styles.quickLabel, { color: P.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  welfareCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: -12,
  },
  welfareTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ringLabel: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  ringSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  welfareCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  benefitChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  benefitChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  benefitChipValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  unlockBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionCard: {
    width: (width - 40 - 20) / 3,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'flex-start',
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  schemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  schemeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  schemeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  schemeReason: {
    fontSize: 12,
    lineHeight: 17,
  },
  schemeAmount: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  schemeAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: (width - 40 - 30) / 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
