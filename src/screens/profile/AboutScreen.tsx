import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';
import { usePalette } from '@/store/themeStore';

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        fill={color}
        opacity={0.15}
      />
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props { onBack: () => void; }

export function AboutScreen({ onBack }: Props) {
  const P = usePalette();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildYear = new Date().getFullYear();

  return (
    <SafeAreaView style={[s.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: P.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: P.textPrimary }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.brand}>
          <View style={[s.logoCircle, { backgroundColor: P.primaryA20, borderColor: P.primaryA30 }]}>
            <ShieldIcon color={P.primary} size={32} />
          </View>
          <Text style={[s.appName, { color: P.textPrimary }]}>BenefitOS</Text>
          <View style={[s.versionBadge, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[s.versionText, { color: P.textMuted }]}>Version {version}</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.cardHeading, { color: P.textPrimary }]}>What is BenefitOS?</Text>
          <Text style={[s.cardText, { color: P.textSecondary }]}>
            India has over 300 active central and state government welfare schemes covering agriculture, education, healthcare, housing and pensions. Most eligible citizens never apply because they don't know the schemes exist or don't understand if they qualify.{'\n\n'}
            BenefitOS solves this with a graph intelligence engine. We map every scheme's eligibility criteria as relationships in a Neo4j graph. When you log in, the graph traversal finds every scheme your profile satisfies in real time, calculates your Welfare Score, and generates a personalised roadmap to close the gap.
          </Text>
        </View>

        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.cardHeading, { color: P.textPrimary }]}>Technology Stack</Text>
          {[
            ['Graph Database', 'Neo4j — citizen-scheme relationships'],
            ['Mobile App', 'React Native + Expo SDK 56'],
            ['AI Assistant', 'Sarvam AI — Hindi-first STT & TTS'],
            ['Backend', 'Node.js + Express'],
            ['State Management', 'Zustand'],
          ].map(([tech, desc]) => (
            <View key={tech} style={[s.techRow, { borderBottomColor: P.border }]}>
              <Text style={[s.techName, { color: P.textPrimary }]}>{tech}</Text>
              <Text style={[s.techDesc, { color: P.textSecondary }]}>{desc}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.footer, { color: P.textMuted }]}>
          © {buildYear} BenefitOS — HackHazards 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  body: { padding: 24, paddingBottom: 56, alignItems: 'stretch' },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  versionBadge: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  versionText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  cardText: { fontSize: 13, lineHeight: 21 },
  techRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  techName: { fontSize: 13, fontWeight: '600', width: 130 },
  techDesc: { fontSize: 13, flex: 1, lineHeight: 18 },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
