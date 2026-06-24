import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

// Pull version from Expo Constants — the app.json version field
import Constants from 'expo-constants';

interface Props { onBack: () => void; }

export function AboutScreen({ onBack }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildYear = new Date().getFullYear();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Brand block */}
        <View style={s.brand}>
          <View style={s.logoCircle}>
            <Text style={s.logoEmoji}>🛡️</Text>
          </View>
          <Text style={s.appName}>BenefitOS</Text>
          <Text style={s.versionBadge}>Version {version}</Text>
        </View>

        {/* What it is */}
        <View style={s.card}>
          <Text style={s.cardHeading}>What is BenefitOS?</Text>
          <Text style={s.cardText}>
            India has over 300 active central and state government welfare schemes —
            covering agriculture subsidies, education scholarships, healthcare coverage,
            pension programs, and housing support. The problem: most eligible citizens
            never apply because they don't know the schemes exist or don't understand
            if they qualify.{'\n\n'}
            BenefitOS solves this with a graph intelligence engine. We map every scheme's
            eligibility criteria — income ceiling, age range, life stage, state availability
            — as relationships in a Neo4j graph. When you log in, the graph traversal finds
            every scheme your profile satisfies in real time, calculates your Welfare Score,
            and generates a personalised roadmap to close the gap.{'\n\n'}
            Built during Hackathon 2024 as a proof of concept for AI-assisted welfare navigation.
          </Text>
        </View>

        {/* Tech stack */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Technology</Text>
          {[
            ['Graph Database', 'Neo4j — citizen-scheme relationships'],
            ['Mobile', 'React Native + Expo SDK 56'],
            ['AI Assistant', 'Sarvam AI (STT + TTS, Hindi-first)'],
            ['Backend', 'Node.js + Express'],
            ['State', 'Zustand'],
          ].map(([tech, desc]) => (
            <View key={tech} style={s.techRow}>
              <Text style={s.techName}>{tech}</Text>
              <Text style={s.techDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        <Text style={s.footer}>© {buildYear} BenefitOS · All rights reserved</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backIcon: { color: Palette.textSecondary, fontSize: 22 },
  title: { flex: 1, textAlign: 'center', color: Palette.textPrimary, fontSize: 17, fontWeight: '700' },
  body: { padding: 24, paddingBottom: 56, alignItems: 'stretch' },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Palette.primaryA22,
    borderWidth: 2, borderColor: Palette.primaryA55,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoEmoji: { fontSize: 30 },
  appName: {
    color: Palette.textPrimary, fontSize: 28, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 6,
  },
  versionBadge: {
    color: Palette.textMuted, fontSize: 12, fontWeight: '600',
    backgroundColor: Palette.surface, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: Palette.border,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    padding: 20, marginBottom: 16,
  },
  cardHeading: {
    color: Palette.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12,
  },
  cardText: { color: Palette.textSecondary, fontSize: 13, lineHeight: 21 },
  techRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  techName: { color: Palette.textPrimary, fontSize: 13, fontWeight: '600', width: 120 },
  techDesc: { color: Palette.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  footer: {
    color: Palette.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8,
  },
});
