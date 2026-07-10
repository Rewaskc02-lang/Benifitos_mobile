import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';
import { SCHEMES as ALL_SCHEMES, type Scheme } from './SchemesScreen';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} />
      <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BackIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GridIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function HelpCircleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9.09 9C9.33 8.31 9.82 7.72 10.46 7.34C11.1 6.96 11.86 6.83 12.59 6.97C13.32 7.1 13.99 7.49 14.45 8.07C14.91 8.64 15.14 9.37 15 10.09C14.72 11.52 13 12 13 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function MapIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6L8 3L16 7L21 4V18L16 21L8 17L3 20V6Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Static FAQ data for search
// ---------------------------------------------------------------------------

type FAQResult = { id: string; question: string; answer: string };

const FAQ_DATA: FAQResult[] = [
  {
    id: 'f1',
    question: 'What is a Welfare Score?',
    answer: 'Your welfare score is the percentage of available government benefits you are currently receiving vs the total you are eligible for.',
  },
  {
    id: 'f2',
    question: 'How do I improve my welfare score?',
    answer: 'Apply for the schemes listed in your "Schemes You\'re Missing" section. Each successful application increases your score.',
  },
  {
    id: 'f3',
    question: 'What is PM-KISAN?',
    answer: 'PM-KISAN provides Rs. 6,000/year directly to eligible small and marginal farmers in 3 instalments of Rs. 2,000 each.',
  },
  {
    id: 'f4',
    question: 'What is Ayushman Bharat?',
    answer: 'Ayushman Bharat PM-JAY provides Rs. 5 Lakh per year health insurance coverage for hospitalisation at empaneled hospitals.',
  },
  {
    id: 'f5',
    question: 'How do I apply for NSP scholarship?',
    answer: 'Register on scholarships.gov.in before October 31. Upload your income certificate, Aadhaar, marksheet, and bank details.',
  },
  {
    id: 'f6',
    question: 'What is MUDRA loan?',
    answer: 'PM Mudra Yojana provides collateral-free loans up to Rs. 10 Lakh for small businesses through banks and microfinance institutions.',
  },
  {
    id: 'f7',
    question: 'Can I get a house under PMAY?',
    answer: 'Under PMAY, first-time homebuyers in EWS/LIG/MIG categories get interest subsidy of up to Rs. 2.67 Lakh on home loans.',
  },
  {
    id: 'f8',
    question: 'What documents do I need for most schemes?',
    answer: 'Most government schemes require Aadhaar Card, Income Certificate, Bank Account (Aadhaar-linked), and a mobile number.',
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResultType = 'scheme' | 'faq' | 'roadmap';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  meta?: string;
};

// ---------------------------------------------------------------------------
// Search logic
// ---------------------------------------------------------------------------

function buildResults(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  ALL_SCHEMES.forEach((scheme) => {
    const score =
      (scheme.name.toLowerCase().includes(q) ? 3 : 0) +
      (scheme.category.toLowerCase().includes(q) ? 2 : 0) +
      (scheme.ministry.toLowerCase().includes(q) ? 1 : 0) +
      (scheme.aiSummary.toLowerCase().includes(q) ? 1 : 0) +
      (scheme.tags.some((t) => t.toLowerCase().includes(q)) ? 2 : 0);
    if (score > 0) {
      results.push({
        id: `s-${scheme.id}`,
        type: 'scheme',
        title: scheme.name,
        subtitle: scheme.benefit,
        meta: scheme.category,
      });
    }
  });

  FAQ_DATA.forEach((faq) => {
    if (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    ) {
      results.push({
        id: `f-${faq.id}`,
        type: 'faq',
        title: faq.question,
        subtitle: faq.answer,
        meta: 'FAQ',
      });
    }
  });

  const roadmapKeywords = ['roadmap', 'plan', 'timeline', 'journey', 'stage', 'life event'];
  if (roadmapKeywords.some((k) => k.includes(q) || q.includes(k))) {
    results.push({
      id: 'r-roadmap',
      type: 'roadmap',
      title: 'Your Benefit Roadmap',
      subtitle: 'View your AI-generated life journey and upcoming scheme milestones',
      meta: 'Roadmap',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Recent searches — stored in memory (no persistence needed)
// ---------------------------------------------------------------------------

const RECENT_DEFAULTS = [
  'PM-KISAN eligibility',
  'scholarship documents',
  'Ayushman Bharat hospital',
  'MUDRA loan apply',
];

// ---------------------------------------------------------------------------
// ResultIcon
// ---------------------------------------------------------------------------

function ResultIcon({ type, P }: { type: ResultType; P: ReturnType<typeof usePalette> }) {
  switch (type) {
    case 'scheme': return <GridIcon color={P.primary} />;
    case 'faq': return <HelpCircleIcon color={P.success} />;
    case 'roadmap': return <MapIcon color={P.accent} />;
  }
}

function typeColor(type: ResultType, P: ReturnType<typeof usePalette>): string {
  switch (type) {
    case 'scheme': return P.primary;
    case 'faq': return P.success;
    case 'roadmap': return P.accent;
  }
}

// ---------------------------------------------------------------------------
// GlobalSearch
// ---------------------------------------------------------------------------

interface Props {
  onBack: () => void;
}

export function GlobalSearch({ onBack }: Props) {
  const P = usePalette();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_DEFAULTS);

  const results = useMemo(() => buildResults(query), [query]);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    setRecentSearches((prev) => [text, ...prev.filter((s) => s !== text)].slice(0, 8));
  };

  const runRecent = (text: string) => {
    setQuery(text);
    handleSubmit(text);
  };

  const clearRecents = () => setRecentSearches([]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: P.surface, borderColor: P.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <SearchIcon color={P.textMuted} size={18} />
        <TextInput
          ref={inputRef}
          autoFocus
          style={[styles.searchInput, { color: P.textPrimary }]}
          placeholder="Search schemes, FAQs, benefits..."
          placeholderTextColor={P.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => handleSubmit(query)}
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(''); inputRef.current?.focus(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clearBtn, { color: P.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {query.trim() === '' ? (
        /* — Recent searches */
        <FlatList
          data={recentSearches}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recentContent}
          ListHeaderComponent={
            <View style={styles.recentHeader}>
              <Text style={[styles.recentTitle, { color: P.textPrimary }]}>Recent Searches</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={clearRecents} activeOpacity={0.7}>
                  <Text style={[styles.clearAll, { color: P.accent }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.recentRow, { backgroundColor: P.surface, borderColor: P.border }]}
              onPress={() => runRecent(item)}
              activeOpacity={0.8}
            >
              <SearchIcon color={P.textMuted} size={14} />
              <Text style={[styles.recentText, { color: P.textSecondary }]}>{item}</Text>
              <ChevronRightIcon color={P.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.noRecent, { color: P.textMuted }]}>
              No recent searches.
            </Text>
          }
        />
      ) : (
        /* — Results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: P.textMuted }]}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: P.surface, borderColor: P.border }]}
              activeOpacity={0.82}
              onPress={() => {
                handleSubmit(query);
                Keyboard.dismiss();
              }}
            >
              <View
                style={[
                  styles.resultIconWrap,
                  {
                    backgroundColor: item.type === 'scheme'
                      ? P.primaryA10
                      : item.type === 'faq'
                        ? P.successA15
                        : P.accentA15,
                  },
                ]}
              >
                <ResultIcon type={item.type} P={P} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {item.meta && (
                    <View
                      style={[
                        styles.metaBadge,
                        { backgroundColor: typeColor(item.type, P) + '15' },
                      ]}
                    >
                      <Text
                        style={[styles.metaBadgeText, { color: typeColor(item.type, P) }]}
                      >
                        {item.meta}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.resultTitle, { color: P.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.resultSubtitle, { color: P.textSecondary }]} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
              <ChevronRightIcon color={P.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <SearchIcon color={P.textMuted} size={40} />
              <Text style={[styles.emptyTitle, { color: P.textSecondary }]}>
                No results for "{query}"
              </Text>
              <Text style={[styles.emptyBody, { color: P.textMuted }]}>
                Try searching for a scheme name, category, or benefit type.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: { width: 28, alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 15 },
  clearBtn: { fontSize: 14, paddingHorizontal: 4 },
  recentContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  clearAll: { fontSize: 13, fontWeight: '600' },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentText: { flex: 1, fontSize: 14 },
  noRecent: { textAlign: 'center', fontSize: 13, marginTop: 48 },
  resultsContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  resultsCount: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  resultIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaBadgeText: { fontSize: 10, fontWeight: '700' },
  resultTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  resultSubtitle: { fontSize: 12, lineHeight: 17 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
