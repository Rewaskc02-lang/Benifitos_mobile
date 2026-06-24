import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

const FAQS = [
  {
    q: 'How does BenefitOS match me to welfare schemes?',
    a: 'We use a Neo4j graph database to map relationships between your profile (age, income, state, life stage) and every government scheme\'s eligibility criteria. When you log in, the graph traversal engine instantly finds schemes where all your attributes satisfy the scheme\'s requirements — income ceiling, age range, state availability, and life stage targeting.',
  },
  {
    q: 'Why is my Welfare Score below 100%?',
    a: 'Your Welfare Score is calculated as (current benefits you are receiving) ÷ (total benefits you are eligible for). A score below 100% means there are schemes you qualify for but haven\'t yet applied to. The "Schemes You\'re Missing" section lists exactly which ones and why.',
  },
  {
    q: 'Are the listed schemes guaranteed? Can I apply directly through the app?',
    a: 'The schemes listed are matched based on your profile data. Eligibility rules can change when governments update policies. BenefitOS shows you the opportunity — you apply directly through the scheme\'s official government portal or your nearest government service centre. We do not process applications.',
  },
  {
    q: 'My family members aren\'t showing up. Why?',
    a: 'Family household data is set up during the seeding process for demo citizens. If you registered a new account, you are not yet part of a household in the graph. In a production version, there would be a "Manage Household" feature to add family members and link them.',
  },
  {
    q: 'Is my data safe? Who can see my information?',
    a: 'Your data is stored on a Neo4j database you or your operator controls. BenefitOS does not send your data to any third-party analytics or advertising services. See Privacy & Security in this menu for the full list of what is stored.',
  },
];

interface Props { onBack: () => void; }

export function HelpSupportScreen({ onBack }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHeader}>Frequently Asked Questions</Text>
        <View style={s.card}>
          {FAQS.map((faq, idx) => (
            <View
              key={idx}
              style={idx < FAQS.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: Palette.border }
                : undefined}
            >
              <TouchableOpacity
                style={s.faqQuestion}
                onPress={() => toggle(idx)}
                activeOpacity={0.7}
              >
                <Text style={s.faqQ}>{faq.q}</Text>
                <Text style={s.faqChevron}>{openIdx === idx ? '↑' : '↓'}</Text>
              </TouchableOpacity>
              {openIdx === idx && (
                <Text style={s.faqA}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>

        <Text style={s.sectionHeader}>Contact</Text>
        <TouchableOpacity
          style={s.contactRow}
          activeOpacity={0.75}
          onPress={() => Linking.openURL('mailto:support@benefitos.dev?subject=BenefitOS%20Support')}
        >
          <Text style={s.contactIcon}>✉️</Text>
          <View style={s.contactText}>
            <Text style={s.contactLabel}>Email Support</Text>
            <Text style={s.contactSub}>support@benefitos.dev</Text>
          </View>
          <Text style={s.contactChevron}>›</Text>
        </TouchableOpacity>
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
  body: { padding: 24, paddingBottom: 48 },
  sectionHeader: {
    color: Palette.textSecondary, fontSize: 13, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 12, marginTop: 8,
  },
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    overflow: 'hidden', marginBottom: 24,
  },
  faqQuestion: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  faqQ: { flex: 1, color: Palette.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqChevron: { color: Palette.textMuted, fontSize: 16, marginLeft: 12, marginTop: 2 },
  faqA: {
    color: Palette.textSecondary, fontSize: 13, lineHeight: 20,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    paddingHorizontal: 20, paddingVertical: 18,
  },
  contactIcon: { fontSize: 22, marginRight: 14 },
  contactText: { flex: 1 },
  contactLabel: { color: Palette.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  contactSub: { color: Palette.textMuted, fontSize: 12 },
  contactChevron: { color: Palette.textMuted, fontSize: 20, marginLeft: 8 },
});
