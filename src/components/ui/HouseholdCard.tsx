import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CitizenProfile } from '@/lib/api/services/citizenService';
import { Palette } from '@/constants/theme';

function formatINR(n: number | null) {
  if (n == null) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

interface Props {
  profile: CitizenProfile | null;
  isLoading: boolean;
}

export function HouseholdCard({ profile, isLoading }: Props) {
  if (isLoading) {
    return (
      <View
        style={{
          marginHorizontal: 24,
          marginBottom: 24,
          backgroundColor: Palette.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: Palette.border,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={Palette.primary} />
      </View>
    );
  }

  if (!profile) return null;

  const hasFamily = profile.family && profile.family.length > 0;

  return (
    <View
      style={{
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: Palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Palette.border,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Palette.border,
        }}
      >
        <Text style={{ color: Palette.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 }}>
          Your Profile
        </Text>
        {profile.lifeStage && (
          <View
            style={{
              backgroundColor: Palette.primaryA12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: Palette.primaryA44,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: Palette.primary, fontSize: 11, fontWeight: '700' }}>
              {profile.lifeStage}
            </Text>
          </View>
        )}
      </View>

      {/* Stat chips */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 8,
          borderBottomWidth: hasFamily ? 1 : 0,
          borderBottomColor: Palette.border,
        }}
      >
        {[
          { label: 'Age', value: profile.age != null ? `${profile.age} yrs` : '—' },
          { label: 'Income', value: formatINR(profile.income) },
          { label: 'State', value: profile.state ?? '—' },
        ].map((chip) => (
          <View
            key={chip.label}
            style={{
              flex: 1,
              backgroundColor: Palette.background,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Palette.border,
              paddingVertical: 10,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: Palette.textPrimary, fontSize: 13, fontWeight: '700' }}>
              {chip.value}
            </Text>
            <Text style={{ color: Palette.textMuted, fontSize: 10, marginTop: 2 }}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Family members — only if the citizen has household data */}
      {hasFamily && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 }}>
          <Text
            style={{
              color: Palette.textMuted,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Household Members
          </Text>
          {profile.family.map((member, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: Palette.border,
              }}
            >
              {/* Avatar bubble */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Palette.secondaryA0D,
                  borderWidth: 1,
                  borderColor: Palette.secondaryA22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  flexShrink: 0,
                }}
              >
                <Text style={{ color: Palette.secondary, fontSize: 13, fontWeight: '700' }}>
                  {member.name?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Palette.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {member.name}
                </Text>
                <Text style={{ color: Palette.textMuted, fontSize: 11, marginTop: 1 }}>
                  {member.relationship}
                  {member.age != null ? ` · ${member.age} yrs` : ''}
                </Text>
              </View>
              {member.lifeStage && member.lifeStage !== 'General' && (
                <Text style={{ color: Palette.textMuted, fontSize: 11 }}>
                  {member.lifeStage}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
