import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';
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

function TrendUpIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6H23V12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendDownIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 18H23V12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BeakerIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3H15M9 3V10L4.2 19.2C3.8 19.9 4.1 20.8 4.9 21.1C5.1 21.2 5.4 21.2 5.6 21.2H18.4C19.3 21.2 20 20.5 20 19.6C20 19.4 19.9 19.1 19.8 18.9L15 10V3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.6 15H17.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

type SimScenario = {
  id: string;
  title: string;
  description: string;
  icon: string;
  gained: string[];
  lost: string[];
  newBenefit: number;
  lostBenefit: number;
  netChange: number;
  advice: string;
};

const SCENARIOS: SimScenario[] = [
  {
    id: 'start_business',
    title: 'Start a Business',
    description: 'What if I register an MSME or become self-employed?',
    icon: 'business',
    gained: ['PM Mudra Yojana (up to Rs. 10 Lakh loan)', 'Startup India Seed Fund', 'MSME Cluster Development', 'CGTMSE Collateral-free Loan'],
    lost: ['PMEGP subsidy (if already availed)', 'Student scholarships (if applicable)'],
    newBenefit: 1050000,
    lostBenefit: 50000,
    netChange: 1000000,
    advice: 'Registering as an MSME unlocks significant loan access. Start with Shishu MUDRA (Rs. 50K) for low-risk entry. Keep your income certificate updated to stay below MSME turnover limits.',
  },
  {
    id: 'get_married',
    title: 'Get Married',
    description: 'What if I get married and start a family?',
    icon: 'family',
    gained: ['Joint PMAY housing subsidy (higher amount)', 'Maternity Benefit Programme (Rs. 5,000)', 'Janani Suraksha Yojana', 'Child immunisation benefits'],
    lost: ['Single-applicant scholarships', 'Bachelor-specific housing schemes'],
    newBenefit: 300000,
    lostBenefit: 20000,
    netChange: 280000,
    advice: 'Post-marriage, apply for PMAY jointly — the subsidy amount is higher for married couples. Ensure both Aadhaar cards are linked and add your spouse to your BenefitOS household.',
  },
  {
    id: 'income_increase',
    title: 'Income Increases Above Rs. 5 LPA',
    description: 'What happens if my income crosses Rs. 5 Lakh per year?',
    icon: 'income',
    gained: ['NPS tier-2 investment benefits', 'Additional tax deductions', 'Home loan interest subsidy (higher category)'],
    lost: ['NSP Post-matric scholarship', 'EWS quota benefits', 'PM-KISAN (if urban migrant)'],
    newBenefit: 80000,
    lostBenefit: 95000,
    netChange: -15000,
    advice: 'Crossing Rs. 5 LPA makes you ineligible for some need-based schemes but opens tax-linked benefits. Transition gradually and ensure you complete all pending scholarship applications before crossing this threshold.',
  },
  {
    id: 'turn_60',
    title: 'Turn 60 / Senior Citizen',
    description: 'What new benefits open up when I turn 60?',
    icon: 'senior',
    gained: ['PM Vaya Vandana Yojana (8% pension)', 'Senior Citizen Savings Scheme', 'PMJDY senior benefits', 'Rashtriya Vayoshri Yojana (assisted devices)', 'Extra income tax exemption'],
    lost: ['Youth skill schemes (age limit)', 'PMKVY training grants'],
    newBenefit: 240000,
    lostBenefit: 15000,
    netChange: 225000,
    advice: 'At 60, prioritise the PM Vaya Vandana Yojana for guaranteed pension and the Senior Citizen Savings Scheme for tax-efficient interest income. Apply for the Ayushman Bharat health card to cover hospitalisation.',
  },
  {
    id: 'buy_land',
    title: 'Buy Agricultural Land',
    description: 'What if I purchase 1-2 hectares of agricultural land?',
    icon: 'farm',
    gained: ['PM-KISAN (Rs. 6,000/year direct benefit)', 'PMFBY Crop Insurance', 'Soil Health Card Scheme', 'Kisan Credit Card (KCC)'],
    lost: [],
    newBenefit: 36000,
    lostBenefit: 0,
    netChange: 36000,
    advice: 'Register your land records and get a Soil Health Card first — this is required for PMFBY crop insurance. Apply for KCC at your nearest cooperative bank for working capital at 4% interest.',
  },
];

// ---------------------------------------------------------------------------
// formatINR
// ---------------------------------------------------------------------------

function formatINR(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '+';
  if (abs >= 100000) return `${sign}\u20B9${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}\u20B9${(abs / 1000).toFixed(0)}K`;
  return `${sign}\u20B9${abs}`;
}

// ---------------------------------------------------------------------------
// SimulationResult
// ---------------------------------------------------------------------------

function SimulationResult({
  scenario,
  onBack,
}: {
  scenario: SimScenario;
  onBack: () => void;
}) {
  const P = usePalette();
  const netPositive = scenario.netChange >= 0;

  return (
    <SafeAreaView style={[sStyles.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[sStyles.header, { backgroundColor: P.primary }]}>
        <TouchableOpacity onPress={onBack} style={sStyles.backBtn} activeOpacity={0.7}>
          <BackIcon color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={sStyles.headerTitle} numberOfLines={1}>
          {scenario.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={sStyles.body} showsVerticalScrollIndicator={false}>
        {/* Net impact card */}
        <View
          style={[
            sStyles.netCard,
            {
              backgroundColor: netPositive ? P.successA15 : P.errorA15,
              borderColor: netPositive ? P.successA30 : P.errorA30,
            },
          ]}
        >
          <Text style={[sStyles.netLabel, { color: P.textMuted }]}>NET ANNUAL BENEFIT CHANGE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            {netPositive
              ? <TrendUpIcon color={P.success} size={24} />
              : <TrendDownIcon color={P.error} size={24} />}
            <Text
              style={[
                sStyles.netValue,
                { color: netPositive ? P.success : P.error },
              ]}
            >
              {formatINR(scenario.netChange)} / year
            </Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles2.row}>
          <View style={[styles2.halfCard, { backgroundColor: P.surface, borderColor: P.successA30, borderLeftColor: P.success, borderLeftWidth: 3 }]}>
            <Text style={[styles2.halfTitle, { color: P.success }]}>Schemes Gained</Text>
            <Text style={[styles2.halfAmount, { color: P.success }]}>{formatINR(scenario.newBenefit)}</Text>
            {scenario.gained.map((g, i) => (
              <Text key={i} style={[styles2.halfItem, { color: P.textSecondary }]}>+ {g}</Text>
            ))}
          </View>
          <View style={[styles2.halfCard, { backgroundColor: P.surface, borderColor: P.errorA30, borderLeftColor: P.error, borderLeftWidth: 3 }]}>
            <Text style={[styles2.halfTitle, { color: P.error }]}>Schemes Lost</Text>
            <Text style={[styles2.halfAmount, { color: P.error }]}>{formatINR(-scenario.lostBenefit)}</Text>
            {scenario.lost.length > 0
              ? scenario.lost.map((l, i) => (
                  <Text key={i} style={[styles2.halfItem, { color: P.textSecondary }]}>- {l}</Text>
                ))
              : <Text style={[styles2.halfItem, { color: P.textMuted }]}>None</Text>}
          </View>
        </View>

        {/* AI Advice */}
        <View style={[sStyles.adviceCard, { backgroundColor: P.surface, borderColor: P.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BeakerIcon color={P.primary} size={16} />
            <Text style={[sStyles.adviceTitle, { color: P.textPrimary }]}>AI Advisor Recommendation</Text>
          </View>
          <Text style={[sStyles.adviceText, { color: P.textSecondary }]}>{scenario.advice}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { padding: 20, paddingBottom: 48 },
  netCard: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 16,
  },
  netLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  netValue: { fontSize: 28, fontWeight: '800' },
  adviceCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginTop: 4 },
  adviceTitle: { fontSize: 15, fontWeight: '700' },
  adviceText: { fontSize: 13, lineHeight: 21 },
});

const styles2 = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  halfCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14 },
  halfTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  halfAmount: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  halfItem: { fontSize: 11, lineHeight: 17, marginBottom: 3 },
});

// ---------------------------------------------------------------------------
// WelfareSimulator main
// ---------------------------------------------------------------------------

interface Props { onBack: () => void; }

export function WelfareSimulator({ onBack }: Props) {
  const P = usePalette();
  const [activeScenario, setActiveScenario] = useState<SimScenario | null>(null);
  const [loading, setLoading] = useState(false);

  const runScenario = async (scenario: SimScenario) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setActiveScenario(scenario);
  };

  if (activeScenario) {
    return <SimulationResult scenario={activeScenario} onBack={() => setActiveScenario(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: P.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <BackIcon color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Welfare Simulator</Text>
          <Text style={styles.headerSub}>See how life changes affect your benefits</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <ActivityIndicator color={P.primary} size="large" />
            <Text style={[styles.loadingText, { color: P.textPrimary }]}>Running simulation...</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        pointerEvents={loading ? 'none' : 'auto'}
      >
        <Text style={[styles.pageIntro, { color: P.textSecondary }]}>
          Choose a life event below to see which schemes you gain, which you lose, and the net annual benefit impact.
        </Text>

        {SCENARIOS.map((scenario) => {
          const netPositive = scenario.netChange >= 0;
          return (
            <TouchableOpacity
              key={scenario.id}
              style={[styles.scenarioCard, { backgroundColor: P.surface, borderColor: P.border }]}
              onPress={() => runScenario(scenario)}
              activeOpacity={0.8}
              accessibilityLabel={scenario.title}
              accessibilityRole="button"
            >
              <View style={styles.scenarioTop}>
                <View
                  style={[
                    styles.scenarioIconWrap,
                    { backgroundColor: netPositive ? P.successA15 : P.errorA15 },
                  ]}
                >
                  {netPositive
                    ? <TrendUpIcon color={P.success} size={20} />
                    : <TrendDownIcon color={P.error} size={20} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scenarioTitle, { color: P.textPrimary }]}>{scenario.title}</Text>
                  <Text style={[styles.scenarioDesc, { color: P.textSecondary }]}>{scenario.description}</Text>
                </View>
                <View
                  style={[
                    styles.netBadge,
                    {
                      backgroundColor: netPositive ? P.successA15 : P.errorA15,
                      borderColor: netPositive ? P.successA30 : P.errorA30,
                    },
                  ]}
                >
                  <Text style={[styles.netBadgeText, { color: netPositive ? P.success : P.error }]}>
                    {formatINR(scenario.netChange)}
                  </Text>
                </View>
              </View>

              <View style={[styles.scenarioFooter, { borderTopColor: P.border }]}>
                <Text style={[styles.scenarioGainCount, { color: P.success }]}>
                  +{scenario.gained.length} schemes
                </Text>
                {scenario.lost.length > 0 && (
                  <Text style={[styles.scenarioLossCount, { color: P.error }]}>
                    -{scenario.lost.length} schemes
                  </Text>
                )}
                <Text style={[styles.scenarioSimulate, { color: P.primary }]}>Simulate</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  body: { padding: 16, paddingBottom: 48 },
  pageIntro: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  scenarioCard: {
    borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
  },
  scenarioTop: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16,
  },
  scenarioIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  scenarioTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  scenarioDesc: { fontSize: 12, lineHeight: 17 },
  netBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
    alignSelf: 'flex-start', flexShrink: 0,
  },
  netBadgeText: { fontSize: 13, fontWeight: '800' },
  scenarioFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
  },
  scenarioGainCount: { fontSize: 12, fontWeight: '700' },
  scenarioLossCount: { fontSize: 12, fontWeight: '700' },
  scenarioSimulate: { marginLeft: 'auto', fontSize: 13, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingCard: {
    borderRadius: 20, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 16,
  },
  loadingText: { fontSize: 15, fontWeight: '600' },
});
