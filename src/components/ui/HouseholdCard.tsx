import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { CitizenProfile } from '@/lib/api/services/citizenService';
import { usePalette } from '@/store/themeStore';

function formatINR(n: number | null) {
  if (n == null) return '—';
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}k`;
  return `\u20B9${n}`;
}

interface Props {
  profile: CitizenProfile | null;
  isLoading: boolean;
}

export function HouseholdCard({ profile, isLoading }: Props) {
  const P = usePalette();

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: P.surface, borderColor: P.border }]}>
        <ActivityIndicator color={P.primary} />
      </View>
    );
  }

  if (!profile) return null;

  const hasFamily = profile.family && profile.family.length > 0;

  return (
    <View style={[styles.card, { backgroundColor: P.surface, borderColor: P.border }]}>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: P.border }]}>
        <Text style={[styles.cardTitle, { color: P.textPrimary }]}>Your Profile</Text>
        {profile.lifeStage && (
          <View style={[styles.stageBadge, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
            <Text style={[styles.stageBadgeText, { color: P.primary }]}>{profile.lifeStage}</Text>
          </View>
        )}
      </View>

      {/* Stat chips */}
      <View style={[styles.chipsRow, { borderBottomColor: P.border, borderBottomWidth: hasFamily ? 1 : 0 }]}>
        {[
          { label: 'Age', value: profile.age != null ? `${profile.age} yrs` : '—' },
          { label: 'Income', value: formatINR(profile.income) },
          { label: 'State', value: profile.state ?? '—' },
        ].map((chip) => (
          <View
            key={chip.label}
            style={[styles.chip, { backgroundColor: P.background, borderColor: P.border }]}
          >
            <Text style={[styles.chipValue, { color: P.textPrimary }]}>{chip.value}</Text>
            <Text style={[styles.chipLabel, { color: P.textMuted }]}>{chip.label}</Text>
          </View>
        ))}
      </View>

      {/* Family */}
      {hasFamily && (
        <View style={styles.familySection}>
          <Text style={[styles.familyHeading, { color: P.textMuted }]}>Household Members</Text>
          {profile.family.map((member, idx) => (
            <View
              key={idx}
              style={[
                styles.memberRow,
                idx > 0 && { borderTopWidth: 1, borderTopColor: P.border },
              ]}
            >
              <View style={[styles.memberAvatar, { backgroundColor: P.primaryA10, borderColor: P.primaryA20 }]}>
                <Text style={[styles.memberAvatarText, { color: P.primary }]}>
                  {member.name?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: P.textPrimary }]}>{member.name}</Text>
                <Text style={[styles.memberSub, { color: P.textMuted }]}>
                  {member.relationship}
                  {member.age != null ? ` · ${member.age} yrs` : ''}
                </Text>
              </View>
              {member.lifeStage && member.lifeStage !== 'General' && (
                <Text style={[styles.memberStage, { color: P.textMuted }]}>{member.lifeStage}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  stageBadge: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3,
  },
  stageBadgeText: { fontSize: 11, fontWeight: '700' },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center',
  },
  chipValue: { fontSize: 13, fontWeight: '700' },
  chipLabel: { fontSize: 10, marginTop: 2 },
  familySection: { paddingHorizontal: 18, paddingBottom: 14, paddingTop: 12 },
  familyHeading: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  memberAvatar: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  memberAvatarText: { fontSize: 13, fontWeight: '700' },
  memberName: { fontSize: 13, fontWeight: '600' },
  memberSub: { fontSize: 11, marginTop: 1 },
  memberStage: { fontSize: 11 },
});
