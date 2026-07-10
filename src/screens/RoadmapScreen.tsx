import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useAuthStore } from '@/store/authStore';
import { usePalette } from '@/store/themeStore';
import { Skeleton } from '@/components/ui/Skeleton';

const CITIZEN_ID_FALLBACK = 'citizen_101';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M12 6V12L16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M8 11V7C8 5.34 9.34 4 11 4H13C14.66 4 16 5.34 16 7V11" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CalendarIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
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

function RefreshIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4V10H17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.49 15C19.84 16.94 18.63 18.64 17 19.85C15.37 21.06 13.41 21.73 11.4 21.78C9.39 21.83 7.4 21.27 5.72 20.16C4.03 19.06 2.73 17.46 2.01 15.59L1 13M1 20V14H7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Static roadmap timeline data (AI-generated, can be dynamic later)
// ---------------------------------------------------------------------------

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  schemes: string[];
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  category: string;
};

const LIFE_STAGE_ROADMAP: Record<string, TimelineEvent[]> = {
  Student: [
    {
      id: '1',
      year: 'Now',
      title: 'Student Phase',
      description: 'Access scholarships and educational support schemes',
      schemes: ['NSP Scholarship', 'Post-Matric Scholarship', 'NCC Scholarship'],
      status: 'current',
      category: 'Education',
    },
    {
      id: '2',
      year: '+1 yr',
      title: 'Skill Development',
      description: 'Enroll in government skill programs for career readiness',
      schemes: ['Skill India Digital', 'PMKVY Certification', 'Coding Bootcamp Grant'],
      status: 'upcoming',
      category: 'Skills',
    },
    {
      id: '3',
      year: '+2 yrs',
      title: 'Graduate / Young Professional',
      description: 'Access startup grants and employment schemes',
      schemes: ['State Startup Seed Grant', 'MSME Registration', 'Startup India'],
      status: 'upcoming',
      category: 'Employment',
    },
    {
      id: '4',
      year: '+5 yrs',
      title: 'Entrepreneur / MSME',
      description: 'Scale your business with MUDRA and CGTMSE loans',
      schemes: ['PM MUDRA Yojana', 'CGTMSE Loan', 'MSME Cluster Development'],
      status: 'locked',
      category: 'Business',
    },
    {
      id: '5',
      year: '+20 yrs',
      title: 'Housing & Family',
      description: 'Buy your first home with PMAY subsidy',
      schemes: ['PMAY Housing Subsidy', 'CLSS Interest Subsidy', 'NPS Pension'],
      status: 'locked',
      category: 'Housing',
    },
  ],
  Farmer: [
    {
      id: '1',
      year: 'Now',
      title: 'Active Farmer',
      description: 'Direct income support and crop insurance',
      schemes: ['PM-KISAN', 'PMFBY Crop Insurance', 'Soil Health Card'],
      status: 'current',
      category: 'Agriculture',
    },
    {
      id: '2',
      year: '+1 yr',
      title: 'Enhanced Input Support',
      description: 'Access equipment subsidies and irrigation schemes',
      schemes: ['KCC Kisan Credit Card', 'PMKSY Irrigation', 'Solar Pump Subsidy'],
      status: 'upcoming',
      category: 'Agriculture',
    },
    {
      id: '3',
      year: '+3 yrs',
      title: 'FPO Formation',
      description: 'Form Farmer Producer Organisation for better pricing',
      schemes: ['10,000 FPO Scheme', 'e-NAM Platform', 'Cold Storage Grant'],
      status: 'upcoming',
      category: 'Business',
    },
    {
      id: '4',
      year: 'Retirement',
      title: 'Senior Citizen Support',
      description: 'Pension and healthcare after 60',
      schemes: ['PM Kisan Maandhan Pension', 'Ayushman Bharat', 'Senior Citizen Savings Scheme'],
      status: 'locked',
      category: 'Retirement',
    },
  ],
  Worker: [
    {
      id: '1',
      year: 'Now',
      title: 'Employed Professional',
      description: 'Build financial security through government schemes',
      schemes: ['EPF', 'ESIC Health Insurance', 'PMJJBY Life Insurance'],
      status: 'current',
      category: 'Employment',
    },
    {
      id: '2',
      year: '+2 yrs',
      title: 'Skill Upgrade',
      description: 'Upskill for better employment opportunities',
      schemes: ['Recognition of Prior Learning', 'PMKVY 4.0', 'SANKALP Grant'],
      status: 'upcoming',
      category: 'Skills',
    },
    {
      id: '3',
      year: '+5 yrs',
      title: 'Housing',
      description: 'Own your first home through PMAY',
      schemes: ['PMAY Urban', 'CLSS Interest Subsidy', 'Housing Loan Tax Benefit'],
      status: 'locked',
      category: 'Housing',
    },
  ],
};

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    year: 'Now',
    title: 'Current Stage',
    description: 'Access government schemes relevant to your current life stage',
    schemes: ['PM-KISAN', 'Ayushman Bharat', 'NSP Scholarship'],
    status: 'current',
    category: 'General',
  },
  {
    id: '2',
    year: 'Next',
    title: 'Next Milestone',
    description: 'Prepare for upcoming scheme eligibility',
    schemes: ['Skill India', 'MUDRA Loan', 'PMAY Housing'],
    status: 'upcoming',
    category: 'General',
  },
];

function getTimelineForStage(stage: string): TimelineEvent[] {
  return LIFE_STAGE_ROADMAP[stage] ?? DEFAULT_EVENTS;
}

function getStatusIcon(status: TimelineEvent['status'], P: ReturnType<typeof usePalette>) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon color={P.success} size={22} />;
    case 'current':
      return <ClockIcon color={P.accent} size={22} />;
    case 'upcoming':
      return <TrendUpIcon color={P.primary} size={22} />;
    case 'locked':
      return <LockIcon color={P.textMuted} size={22} />;
  }
}

function getStatusColor(status: TimelineEvent['status'], P: ReturnType<typeof usePalette>): string {
  switch (status) {
    case 'completed': return P.success;
    case 'current': return P.accent;
    case 'upcoming': return P.primary;
    case 'locked': return P.textMuted;
  }
}

// ---------------------------------------------------------------------------
// RoadmapScreen
// ---------------------------------------------------------------------------

export function RoadmapScreen() {
  const { user } = useAuthStore();
  const P = usePalette();
  const citizenId = user?.id ?? CITIZEN_ID_FALLBACK;
  const { data, isLoading, error, refetch } = useRoadmap(citizenId);
  const [activeOpportunity, setActiveOpportunity] = useState<string | null>(null);

  const currentStage = data?.currentStage ?? 'Student';
  const nextStage = data?.nextStage ?? 'Graduate';
  const opportunities = data?.opportunities ?? [];
  const timeline = getTimelineForStage(currentStage);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: P.primary }]}>
        <Text style={styles.headerSub}>Your Life Journey</Text>
        <Text style={styles.headerTitle}>Benefit Roadmap</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage overview card */}
        {isLoading ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Skeleton height={80} borderRadius={16} />
          </View>
        ) : error ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: P.error, fontSize: 13, marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity
              onPress={refetch}
              style={[styles.retryBtn, { backgroundColor: P.primary }]}
              activeOpacity={0.8}
            >
              <RefreshIcon color={P.white} />
              <Text style={{ color: P.white, fontWeight: '700', marginLeft: 6 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <View style={{ paddingHorizontal: 20, marginTop: -10 }}>
            <View style={[styles.stageOverviewCard, { backgroundColor: P.surface, borderColor: P.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stageOverviewLabel, { color: P.textMuted }]}>CURRENT STAGE</Text>
                <Text style={[styles.stageOverviewValue, { color: P.primary }]}>{currentStage}</Text>
              </View>
              <View style={[styles.stageArrow, { backgroundColor: P.accentA15 }]}>
                <Text style={[{ color: P.accent, fontSize: 16, fontWeight: '700' }]}>→</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.stageOverviewLabel, { color: P.textMuted }]}>NEXT STAGE</Text>
                <Text style={[styles.stageOverviewValue, { color: P.accent }]}>{nextStage}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: P.textPrimary }]}>
              Current Opportunities
            </Text>
            {opportunities.map((opp, index) => (
              <TouchableOpacity
                key={opp}
                style={[
                  styles.opportunityRow,
                  { backgroundColor: P.surface, borderColor: index === 0 ? P.accent : P.border },
                ]}
                onPress={() => setActiveOpportunity(activeOpportunity === opp ? null : opp)}
                activeOpacity={0.8}
              >
                <View style={[styles.oppIndexBubble, { backgroundColor: index === 0 ? P.accent : P.border }]}>
                  <Text style={[styles.oppIndexText, { color: index === 0 ? P.white : P.textMuted }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.oppName, { color: P.textPrimary }]}>{opp}</Text>
                {index === 0 && (
                  <View style={[styles.applyBadge, { backgroundColor: P.accentA25 }]}>
                    <Text style={[styles.applyBadgeText, { color: P.accent }]}>APPLY</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Timeline */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: P.textPrimary, flex: 1 }]}>
              AI Life Roadmap
            </Text>
            <View style={[styles.aiBadge, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
              <Text style={[styles.aiBadgeText, { color: P.primary }]}>AI GENERATED</Text>
            </View>
          </View>

          {timeline.map((event, index) => {
            const statusColor = getStatusColor(event.status, P);
            const isLast = index === timeline.length - 1;

            return (
              <View key={event.id} style={styles.timelineItem}>
                {/* Left column — icon + vertical line */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineIconWrap, { borderColor: statusColor, backgroundColor: P.background }]}>
                    {getStatusIcon(event.status, P)}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor:
                            event.status === 'locked' ? P.borderLight : statusColor,
                          opacity: event.status === 'locked' ? 0.3 : 0.35,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Right column — content */}
                <View style={[styles.timelineContent, { marginBottom: isLast ? 0 : 24 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={[styles.yearBadge, { backgroundColor: P.primaryA10, borderColor: P.primaryA20 }]}>
                      <CalendarIcon color={P.primary} size={11} />
                      <Text style={[styles.yearText, { color: P.primary }]}>{event.year}</Text>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: P.border }]}>
                      <Text style={[styles.categoryText, { color: P.textMuted }]}>{event.category}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.timelineCard,
                      {
                        backgroundColor: P.surface,
                        borderColor: event.status === 'current' ? statusColor : P.border,
                        borderLeftWidth: event.status === 'current' ? 3 : 1,
                        borderLeftColor: statusColor,
                        opacity: event.status === 'locked' ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.timelineTitle, { color: P.textPrimary }]}>{event.title}</Text>
                    <Text style={[styles.timelineDesc, { color: P.textSecondary }]}>{event.description}</Text>

                    {/* Schemes */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {event.schemes.map((scheme) => (
                        <View
                          key={scheme}
                          style={[
                            styles.schemePill,
                            { backgroundColor: P.background, borderColor: P.border },
                          ]}
                        >
                          <Text style={[styles.schemePillText, { color: P.textSecondary }]}>
                            {scheme}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Plans CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Text style={[styles.sectionTitle, { color: P.textPrimary, marginBottom: 14 }]}>
            AI Benefit Plans
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['1 Year', '3 Year', '5 Year'] as const).map((plan) => (
              <View
                key={plan}
                style={[styles.planCard, { backgroundColor: P.surface, borderColor: P.border, flex: 1 }]}
              >
                <Text style={[styles.planTitle, { color: P.primary }]}>{plan}</Text>
                <Text style={[styles.planSub, { color: P.textMuted }]}>Plan</Text>
              </View>
            ))}
          </View>
          <View style={[styles.comingSoon, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
            <TrendUpIcon color={P.primary} size={16} />
            <Text style={[styles.comingSoonText, { color: P.primary }]}>
              Personalised AI benefit plans — Coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  stageOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stageOverviewLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stageOverviewValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  stageArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  oppIndexBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  oppIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  oppName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  applyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  // Timeline
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 48,
    alignItems: 'center',
    paddingTop: 20,
  },
  timelineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingTop: 12,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  yearText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  schemePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  schemePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  planSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
