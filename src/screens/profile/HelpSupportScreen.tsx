import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';

const FAQS = [
  {
    q: 'How does BenefitOS match me to welfare schemes?',
    a: 'We use a Neo4j graph database to map relationships between your profile (age, income, state, life stage) and every government scheme\'s eligibility criteria. The graph traversal engine instantly finds schemes where all your attributes satisfy the scheme\'s requirements.',
  },
  {
    q: 'Why is my Welfare Score below 100%?',
    a: 'Your Welfare Score is calculated as (current benefits received) divided by (total benefits you are eligible for). A score below 100% means there are schemes you qualify for but have not yet applied to.',
  },
  {
    q: 'Are the listed schemes guaranteed?',
    a: 'Schemes are matched based on your profile data. Eligibility rules can change when governments update policies. BenefitOS shows you the opportunity — you apply directly through the official government portal or nearest service centre.',
  },
  {
    q: 'Why are my family members not showing up?',
    a: 'Family household data is linked during the demo seeding process. In production, you would use a "Manage Household" feature to add family members and link their profiles.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your data is stored in a Neo4j database. BenefitOS does not send your data to advertising services. All data is used solely to match you with government welfare schemes.',
  },
];

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props { onBack: () => void; }

export function HelpSupportScreen({ onBack }: Props) {
  const P = usePalette();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: P.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: P.textPrimary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionHeader, { color: P.textSecondary }]}>Frequently Asked Questions</Text>
        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          {FAQS.map((faq, idx) => (
            <View
              key={idx}
              style={idx < FAQS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: P.border } : undefined}
            >
              <TouchableOpacity style={s.faqQuestion} onPress={() => toggle(idx)} activeOpacity={0.7}>
                <Text style={[s.faqQ, { color: P.textPrimary }]}>{faq.q}</Text>
                <Text style={[s.faqChevron, { color: P.textMuted }]}>{openIdx === idx ? '↑' : '↓'}</Text>
              </TouchableOpacity>
              {openIdx === idx && (
                <Text style={[s.faqA, { color: P.textSecondary }]}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>

        <Text style={[s.sectionHeader, { color: P.textSecondary }]}>Contact</Text>
        <TouchableOpacity
          style={[s.contactRow, { backgroundColor: P.surface, borderColor: P.border }]}
          activeOpacity={0.75}
          onPress={() => Linking.openURL('mailto:support@benefitos.dev?subject=BenefitOS%20Support')}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.contactLabel, { color: P.textPrimary }]}>Email Support</Text>
            <Text style={[s.contactSub, { color: P.textMuted }]}>support@benefitos.dev</Text>
          </View>
          <Text style={[s.contactChevron, { color: P.textMuted }]}>›</Text>
        </TouchableOpacity>
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
  body: { padding: 24, paddingBottom: 48 },
  sectionHeader: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  faqQuestion: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 18, paddingVertical: 15,
  },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqChevron: { fontSize: 16, marginLeft: 12, marginTop: 2 },
  faqA: { fontSize: 13, lineHeight: 20, paddingHorizontal: 18, paddingBottom: 15 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  contactLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  contactSub: { fontSize: 12 },
  contactChevron: { fontSize: 20, marginLeft: 8 },
});
