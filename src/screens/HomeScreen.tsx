import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/store/authStore';
import { useWelfareScore } from '@/hooks/useWelfareScore';
import { useMissedBenefits } from '@/hooks/useMissedBenefits';
import { WelfareScoreCard } from '@/components/ui/WelfareScoreCard';
import { MissedBenefitsSection } from '@/components/ui/MissedBenefitsSection';
import { BottomTabParamList } from '@/navigation/RootNavigator';
import { Palette } from '@/constants/theme';
import { citizenService } from '@/lib/api/services/citizenService';
import { notificationService } from '@/lib/api/services/notificationService';
import { get } from '@/lib/api/client';

const CITIZEN_ID_FALLBACK = 'citizen_101';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();
  const citizenId = user?.id ?? CITIZEN_ID_FALLBACK;

  const { data, isLoading, error, refetch } = useWelfareScore(citizenId);
  const { data: missedData, isLoading: missedLoading, error: missedError, refetch: refetchMissed } = useMissedBenefits(citizenId);

  // Live dashboard states
  const [familyOpt, setFamilyOpt] = useState<{ intergenerationalBonusEligible: boolean; familyLevelRecommendations: string[] } | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<{ total: number; available: string[]; missing: string[] } | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!citizenId || !isFocused) return;

    // Trigger hooks data reload
    refetch();
    refetchMissed();

    // Load supplemental intelligence inputs
    Promise.all([
      citizenService.getFamilyOptimization(citizenId).catch(() => null),
      citizenService.getPredictiveEligibility(citizenId).catch(() => null),
      get<any>(`/api/readiness/${citizenId}`).catch(() => null),
      notificationService.getNotifications(citizenId).catch(() => null)
    ]).then(([fOpt, preds, read, notifs]) => {
      if (fOpt) setFamilyOpt(fOpt.householdOptimization);
      if (preds) setPredictions(preds.predictions || []);
      if (read) {
        setReadiness(read);
      } else {
        setReadiness({
          readinessPercentage: 0,
          available: [],
          missing: [],
        });
      }
      if (notifs) {
        const unread = notifs.notifications.some((n: any) => !n.read);
        setHasUnread(unread);
      }
    });
  }, [citizenId, isFocused]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-text-secondary text-sm font-semibold tracking-widest uppercase mb-1">
            Welcome back
          </Text>
          <Text className="text-text-primary text-3xl font-bold">
            {user?.name ?? 'Dashboard'}
          </Text>
        </View>

        {/* Unread notifications alert bar */}
        {hasUnread && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
            style={s.alertBar}
          >
            <Text style={s.alertText}>🔔 You have unread welfare notifications! Tap to read.</Text>
          </TouchableOpacity>
        )}

        {/* Welfare Score Dashboard Card */}
        <WelfareScoreCard
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />

        {/* Document verification progress widget */}
        <View style={s.widgetCard}>
          <Text style={s.widgetHeader}>📁 Document Verification Readiness</Text>
          {readiness ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.widgetTitle}>
                  {readiness.available.length} / {readiness.total} Documents Verified
                </Text>
                {readiness.missing.length > 0 ? (
                  <Text style={s.widgetSubtitle}>
                    Missing: {readiness.missing.join(', ')}
                  </Text>
                ) : (
                  <Text style={[s.widgetSubtitle, { color: '#22c55e' }]}>
                    All required documents active!
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={s.widgetBtn}
              >
                <Text style={s.widgetBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator color={Palette.primary} size="small" style={{ marginTop: 8 }} />
          )}
        </View>

        {/* Family benefit optimizer widget */}
        {familyOpt?.intergenerationalBonusEligible && (
          <View style={[s.widgetCard, { borderColor: '#a78bfa' }]}>
            <Text style={[s.widgetHeader, { color: '#7c3aed' }]}>💡 Household Optimization Bonus</Text>
            <Text style={s.widgetTitle} numberOfLines={2}>
              Your family profile qualifies for intergenerational welfare bonuses!
            </Text>
            <Text style={s.widgetSubtitle}>
              Recommending: {familyOpt.familyLevelRecommendations[0] || 'Aggregate Family Schemes'}
            </Text>
          </View>
        )}

        {/* Predictive eligibility pathway widget */}
        {predictions.length > 0 && (
          <View style={[s.widgetCard, { borderColor: '#60a5fa' }]}>
            <Text style={[s.widgetHeader, { color: '#2563eb' }]}>⏱️ Future Eligible Pathways</Text>
            <Text style={s.widgetTitle}>
              {predictions[0].schemeName}
            </Text>
            <Text style={s.widgetSubtitle}>
              Unlock this scheme representing +₹{predictions[0].benefitAmount.toLocaleString()} by uploading missing documents.
            </Text>
          </View>
        )}

        {/* Missed Benefits */}
        <MissedBenefitsSection
          schemes={missedData?.missedSchemes ?? null}
          isLoading={missedLoading}
          error={missedError}
        />

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-text-primary font-semibold text-lg mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            {([
              { label: 'Roadmap', emoji: '🗺️', tab: 'Roadmap' },
              { label: 'Assistant', emoji: '🤖', tab: 'Assistant' },
              { label: 'Profile', emoji: '👤', tab: 'Profile' },
            ] as { label: string; emoji: string; tab: keyof BottomTabParamList }[]).map((action) => (
              <TouchableOpacity
                key={action.label}
                className="flex-1 rounded-2xl bg-background-card p-4 items-center"
                style={{ borderWidth: 1, borderColor: Palette.border }}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(action.tab)}
              >
                <Text className="text-2xl mb-2">{action.emoji}</Text>
                <Text className="text-text-secondary text-xs font-medium">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  alertBar: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: { fontSize: 13, color: '#b45309', fontWeight: '600' },
  widgetCard: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  widgetHeader: { fontSize: 11, fontWeight: '700', color: Palette.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  widgetTitle: { fontSize: 14, fontWeight: '700', color: Palette.textPrimary, marginBottom: 4 },
  widgetSubtitle: { fontSize: 12, color: Palette.textSecondary },
  widgetBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  widgetBtnText: { color: Palette.white, fontSize: 11, fontWeight: '700' },
});
