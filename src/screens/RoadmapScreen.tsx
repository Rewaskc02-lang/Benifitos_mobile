import { useRoadmap } from '@/hooks/useRoadmap';
import { useAuthStore } from '@/store/authStore';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

const CITIZEN_ID_FALLBACK = 'citizen_101';

// ---------------------------------------------------------------------------
// Connector — vertical line + down arrow between stage cards
// ---------------------------------------------------------------------------
function StageConnector() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 2 }}>
      {/* dashed line */}
      <View
        style={{
          width: 2,
          height: 20,
          backgroundColor: Palette.border,
        }}
      />
      <View
        style={{
          width: 2,
          height: 20,
          backgroundColor: Palette.border,
          marginTop: 4,
          borderStyle: 'dashed',
        }}
      />
      {/* down-pointing chevron */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: Palette.primary,
          marginTop: 2,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stage card — used for both Current and Next
// ---------------------------------------------------------------------------
interface StageCardProps {
  label: string;
  value: string;
  variant: 'current' | 'next';
}

function StageCard({ label, value, variant }: StageCardProps) {
  const isCurrent = variant === 'current';

  const borderColor = isCurrent ? Palette.primary : Palette.secondaryA66;
  const bgColor = isCurrent ? Palette.primaryA18 : Palette.secondaryA0D;
  const labelColor = Palette.textSecondary;
  const valueColor = isCurrent ? Palette.primary : Palette.secondary;
  const badgeBg = isCurrent ? Palette.primary : Palette.secondaryA22;
  const badgeText = isCurrent ? Palette.white : Palette.secondary;
  const badgeLabel = isCurrent ? 'NOW' : 'NEXT';

  return (
    <View
      style={{
        marginHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor,
        padding: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text
          style={{
            color: labelColor,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <View
          style={{
            backgroundColor: badgeBg,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderWidth: isCurrent ? 0 : 1,
            borderColor: Palette.secondaryA44,
          }}
        >
          <Text style={{ color: badgeText, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <Text style={{ color: valueColor, fontSize: 24, fontWeight: '800', lineHeight: 30 }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Opportunity pill / card
// ---------------------------------------------------------------------------
function OpportunityCard({ name, index }: { name: string; index: number }) {
  const isFirst = index === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() =>
        Alert.alert(
          name,
          'Visit the official scheme portal or your nearest government office to begin this application.',
          [{ text: 'Got it', style: 'default' }]
        )
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Palette.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isFirst ? Palette.primaryA55 : Palette.border,
        padding: 14,
        marginBottom: 10,
      }}
    >
      {/* Index bubble */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isFirst ? Palette.primary : Palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        <Text style={{ color: isFirst ? Palette.white : Palette.textMuted, fontSize: 12, fontWeight: '700' }}>
          {index + 1}
        </Text>
      </View>

      <Text
        style={{
          color: isFirst ? Palette.textPrimary : Palette.textSecondary,
          fontSize: 14,
          fontWeight: isFirst ? '600' : '400',
          flex: 1,
          lineHeight: 20,
        }}
      >
        {name}
      </Text>

      {isFirst && (
        <View
          style={{
            backgroundColor: Palette.primaryA22,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: Palette.primary, fontSize: 10, fontWeight: '700' }}>APPLY</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// RoadmapScreen
// ---------------------------------------------------------------------------
export function RoadmapScreen() {
  const { user } = useAuthStore();
  const citizenId = user?.id ?? CITIZEN_ID_FALLBACK;
  const { data, isLoading, error, refetch } = useRoadmap(citizenId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Palette.background }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 }}>
          <Text
            style={{
              color: Palette.textSecondary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Your Journey
          </Text>
          <Text style={{ color: Palette.textPrimary, fontSize: 30, fontWeight: '800' }}>Roadmap</Text>
        </View>

        {/* States */}
        {isLoading ? (
          <View style={{ gap: 16, marginTop: 12, marginHorizontal: 24 }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={{ padding: 16, borderRadius: 20, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, gap: 8 }}>
                <SkeletonLoader height={24} width="40%" />
                <SkeletonLoader height={14} width="85%" />
                <SkeletonLoader height={14} width="60%" />
              </View>
            ))}
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
            <Text style={{ color: Palette.error, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={refetch}
              style={{
                backgroundColor: Palette.primary,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 14,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: Palette.white, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <>
            {/* ── Vertical Timeline ── */}

            {/* Current Stage */}
            <StageCard label="Current Stage" value={data.currentStage} variant="current" />

            {/* Connector arrow */}
            <StageConnector />

            {/* Next Stage */}
            <StageCard label="Next Stage" value={data.nextStage} variant="next" />

            {/* Opportunities */}
            {data.opportunities.length > 0 && (
              <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
                {/* Section heading */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 3,
                      height: 18,
                      backgroundColor: Palette.primary,
                      borderRadius: 2,
                      marginRight: 10,
                    }}
                  />
                  <Text
                    style={{
                      color: Palette.textPrimary,
                      fontSize: 17,
                      fontWeight: '700',
                      flex: 1,
                    }}
                  >
                    Opportunities
                  </Text>
                  <View
                    style={{
                      backgroundColor: Palette.primaryA22,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Palette.primaryA44,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: Palette.primary, fontSize: 12, fontWeight: '700' }}>
                      {data.opportunities.length}
                    </Text>
                  </View>
                </View>

                {data.opportunities.map((opp, index) => (
                  <OpportunityCard key={opp} name={opp} index={index} />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
