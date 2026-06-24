import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/store/authStore';
import { useWelfareScore } from '@/hooks/useWelfareScore';
import { useMissedBenefits } from '@/hooks/useMissedBenefits';
import { WelfareScoreCard } from '@/components/ui/WelfareScoreCard';
import { MissedBenefitsSection } from '@/components/ui/MissedBenefitsSection';
import { BottomTabParamList } from '@/navigation/RootNavigator';
import { Palette } from '@/constants/theme';

const CITIZEN_ID_FALLBACK = 'citizen_101';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { user } = useAuthStore();
  const citizenId = user?.id ?? CITIZEN_ID_FALLBACK;

  // All data-fetching is encapsulated in the hook.
  // To switch from mock → real API, edit only useWelfareScore.ts.
  const { data, isLoading, error, refetch } = useWelfareScore(citizenId);
  const { data: missedData, isLoading: missedLoading, error: missedError } = useMissedBenefits(citizenId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-6">
          <Text className="text-text-secondary text-sm font-semibold tracking-widest uppercase mb-1">
            Welcome back
          </Text>
          <Text className="text-text-primary text-3xl font-bold">
            {user?.name ?? 'Dashboard'}
          </Text>
        </View>

        {/* Welfare Score Dashboard Card */}
        <WelfareScoreCard
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />

        {/* Missed Benefits */}
        <MissedBenefitsSection
          schemes={missedData?.missedSchemes ?? null}
          isLoading={missedLoading}
          error={missedError}
        />

        {/* Quick Actions */}
        <View className="px-6">
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
