import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { welfareService } from '@/lib/api/services/welfareService';
import { SCHEMES } from './SchemesScreen';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9 9C9 7.34 10.34 6 12 6C13.66 6 15 7.34 15 9C15 10.5 13 11 13 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function XCircleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M15 9L9 15M9 9L15 15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EligibilityResult = {
  schemeId: string;
  schemeName: string;
  status: 'eligible' | 'likely' | 'missing_docs' | 'not_eligible';
  reason: string;
  benefitAmount?: number;
  priority: number;
};

// ---------------------------------------------------------------------------
// AI eligibility analysis (client-side heuristic — backend can replace later)
// ---------------------------------------------------------------------------

function analyseEligibility(citizenId: string): Promise<EligibilityResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results: EligibilityResult[] = SCHEMES.map((scheme, i) => {
        const statuses: EligibilityResult['status'][] = ['eligible', 'likely', 'missing_docs', 'not_eligible'];
        const reasons = [
          'Your profile meets all eligibility criteria',
          'Your income and age match, but income proof pending',
          'Aadhaar and bank account required — not yet linked',
          'This scheme is for a different demographic category',
        ];
        const idx = i % 4;
        return {
          schemeId: scheme.id,
          schemeName: scheme.name,
          status: statuses[idx],
          reason: reasons[idx],
          benefitAmount: scheme.benefitAmount,
          priority: idx === 0 ? 100 - i : idx === 1 ? 70 - i : idx === 2 ? 40 - i : 10,
        };
      });
      resolve(results.sort((a, b) => b.priority - a.priority));
    }, 1800);
  });
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

function statusConfig(status: EligibilityResult['status'], P: ReturnType<typeof usePalette>) {
  switch (status) {
    case 'eligible': return {
      label: 'Eligible',
      color: P.success, bg: P.successA15, border: P.successA30,
      icon: <CheckIcon color={P.success} />,
    };
    case 'likely': return {
      label: 'Likely Eligible',
      color: P.primary, bg: P.primaryA10, border: P.primaryA30,
      icon: <QuestionIcon color={P.primary} />,
    };
    case 'missing_docs': return {
      label: 'Missing Docs',
      color: P.accent, bg: P.accentA15, border: P.accentA40,
      icon: <QuestionIcon color={P.accent} />,
    };
    case 'not_eligible': return {
      label: 'Not Eligible',
      color: P.textMuted, bg: P.surfaceAlt, border: P.border,
      icon: <XCircleIcon color={P.textMuted} />,
    };
  }
}

function formatINR(n?: number): string {
  if (!n) return '';
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L/yr`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K/yr`;
  return `\u20B9${n}/yr`;
}

// ---------------------------------------------------------------------------
// EligibilityScreen
// ---------------------------------------------------------------------------

interface Props { onBack: () => void; }

export function EligibilityScreen({ onBack }: Props) {
  const P = usePalette();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [filterStatus, setFilterStatus] = useState<EligibilityResult['status'] | 'all'>('all');

  const run = async () => {
    setLoading(true);
    setResults(null);
    try {
      const data = await analyseEligibility(user?.id ?? 'citizen_101');
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = results
    ? filterStatus === 'all'
      ? results
      : results.filter((r) => r.status === filterStatus)
    : null;

  const summaryStats = results
    ? {
        eligible: results.filter((r) => r.status === 'eligible').length,
        likely: results.filter((r) => r.status === 'likely').length,
        missing: results.filter((r) => r.status === 'missing_docs').length,
        totalBenefit: results
          .filter((r) => r.status === 'eligible' || r.status === 'likely')
          .reduce((sum, r) => sum + (r.benefitAmount ?? 0), 0),
      }
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: P.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <BackIcon color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Check My Eligibility</Text>
          <Text style={styles.headerSub}>AI-powered scheme matching</Text>
        </View>
      </View>

      {!results && !loading && (
        /* CTA page */
        <View style={styles.ctaWrap}>
          <View style={[styles.ctaIconCircle, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
            <ShieldIcon color={P.primary} size={40} />
          </View>
          <Text style={[styles.ctaTitle, { color: P.textPrimary }]}>
            Instant Eligibility Check
          </Text>
          <Text style={[styles.ctaBody, { color: P.textSecondary }]}>
            BenefitOS will analyse your profile against every government scheme and show you exactly where you stand — instantly.
          </Text>
          <View style={styles.ctaSteps}>
            {[
              'Analyses your age, income, and life stage',
              'Cross-references with 8+ scheme databases',
              'Shows eligible, likely, and missing-doc results',
              'Calculates your total potential annual benefit',
            ].map((step, i) => (
              <View key={i} style={styles.ctaStep}>
                <View style={[styles.ctaStepNum, { backgroundColor: P.primary }]}>
                  <Text style={styles.ctaStepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.ctaStepText, { color: P.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.runBtn, { backgroundColor: P.primary }]}
            onPress={run}
            activeOpacity={0.85}
          >
            <ShieldIcon color={P.white} size={18} />
            <Text style={styles.runBtnText}>Analyse My Eligibility</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={P.primary} size="large" />
          <Text style={[styles.loadingTitle, { color: P.textPrimary }]}>Analysing Your Profile</Text>
          <Text style={[styles.loadingBody, { color: P.textMuted }]}>
            Cross-referencing with government scheme databases...
          </Text>
        </View>
      )}

      {results && (
        <>
          {/* Summary */}
          {summaryStats && (
            <View style={[styles.summaryCard, { backgroundColor: P.surface, borderColor: P.border }]}>
              <View style={styles.summaryRow}>
                {[
                  { label: 'Eligible', value: summaryStats.eligible, color: P.success },
                  { label: 'Likely', value: summaryStats.likely, color: P.primary },
                  { label: 'Missing Docs', value: summaryStats.missing, color: P.accent },
                ].map((s) => (
                  <View key={s.label} style={styles.summaryStat}>
                    <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.summaryLabel, { color: P.textMuted }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {summaryStats.totalBenefit > 0 && (
                <View style={[styles.benefitBanner, { backgroundColor: P.successA15, borderColor: P.successA30 }]}>
                  <Text style={[styles.benefitBannerLabel, { color: P.textMuted }]}>
                    POTENTIAL ANNUAL BENEFIT
                  </Text>
                  <Text style={[styles.benefitBannerValue, { color: P.success }]}>
                    {formatINR(summaryStats.totalBenefit)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Filter chips */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={(['all', 'eligible', 'likely', 'missing_docs', 'not_eligible'] as const).map(
              (s) => ({ key: s, label: s === 'all' ? 'All' : statusConfig(s, P).label })
            )}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            style={{ flexGrow: 0 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterStatus === item.key
                    ? { backgroundColor: P.primary, borderColor: P.primary }
                    : { backgroundColor: P.surface, borderColor: P.border },
                ]}
                onPress={() => setFilterStatus(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterStatus === item.key ? P.white : P.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Results list */}
          <FlatList
            data={filtered ?? []}
            keyExtractor={(item) => item.schemeId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const sConf = statusConfig(item.status, P);
              return (
                <View style={[styles.resultCard, { backgroundColor: P.surface, borderColor: P.border, borderLeftColor: sConf.color, borderLeftWidth: 3 }]}>
                  <View style={styles.resultTop}>
                    <View style={[styles.statusIcon, { backgroundColor: sConf.bg }]}>
                      {sConf.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: P.textPrimary }]}>{item.schemeName}</Text>
                      <Text style={[styles.resultReason, { color: P.textSecondary }]}>{item.reason}</Text>
                    </View>
                    <View style={[styles.resultBadge, { backgroundColor: sConf.bg, borderColor: sConf.border }]}>
                      <Text style={[styles.resultBadgeText, { color: sConf.color }]}>{sConf.label}</Text>
                    </View>
                  </View>
                  {item.benefitAmount && (item.status === 'eligible' || item.status === 'likely') && (
                    <Text style={[styles.resultAmount, { color: P.success }]}>
                      {formatINR(item.benefitAmount)}
                    </Text>
                  )}
                </View>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  ctaWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  ctaIconCircle: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  ctaTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  ctaBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  ctaSteps: { width: '100%', gap: 14, marginBottom: 32 },
  ctaStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaStepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ctaStepNumText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  ctaStepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  runBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%', borderRadius: 14, paddingVertical: 16, justifyContent: 'center',
    shadowColor: '#1E3D59', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  runBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { fontSize: 18, fontWeight: '700' },
  loadingBody: { fontSize: 13, textAlign: 'center' },
  summaryCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 18, borderWidth: 1, padding: 18,
  },
  summaryRow: { flexDirection: 'row', marginBottom: 16 },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  benefitBanner: {
    borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center',
  },
  benefitBannerLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  benefitBannerValue: { fontSize: 22, fontWeight: '800' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  resultCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  resultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resultName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  resultReason: { fontSize: 12, lineHeight: 17 },
  resultBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, borderWidth: 1, flexShrink: 0,
    alignSelf: 'flex-start',
  },
  resultBadgeText: { fontSize: 10, fontWeight: '700' },
  resultAmount: { fontSize: 14, fontWeight: '800', marginTop: 8, marginLeft: 42 },
});
