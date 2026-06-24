import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import type { MissedScheme } from '@/lib/api/services/welfareService';
import { Palette } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ---------------------------------------------------------------------------
// Single scheme card
// ---------------------------------------------------------------------------

function SchemeCard({ scheme }: { scheme: MissedScheme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() =>
        Alert.alert(
          scheme.name,
          `${scheme.reason}\n\nVisit your nearest government office or the scheme's official portal to apply.`,
          [{ text: 'Got it', style: 'default' }]
        )
      }
      style={{
        backgroundColor: Palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Palette.border,
        padding: 16,
        marginBottom: 20,
      }}
    >
      {/* Top row: name + amount */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
        {/* Alert dot */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Palette.error,
            marginTop: 5,
            marginRight: 10,
            flexShrink: 0,
          }}
        />
        <Text
          style={{
            color: Palette.textPrimary,
            fontSize: 14,
            fontWeight: '600',
            flex: 1,
            lineHeight: 20,
            marginRight: 12,
          }}
        >
          {scheme.name}
        </Text>
        {/* Amount badge */}
        <View
          style={{
            backgroundColor: Palette.successA18,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Palette.successA33,
            paddingHorizontal: 10,
            paddingVertical: 4,
            flexShrink: 0,
          }}
        >
          <Text style={{ color: Palette.success, fontSize: 15, fontWeight: '800' }}>
            {formatINR(scheme.benefitAmount)}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <Text
        style={{
          color: Palette.textSecondary,
          fontSize: 12,
          lineHeight: 18,
          marginLeft: 18, // aligns under the scheme name, past the dot
        }}
      >
        {scheme.reason}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

interface MissedBenefitsSectionProps {
  schemes: MissedScheme[] | null;
  isLoading: boolean;
  error: string | null;
}

export function MissedBenefitsSection({
  schemes,
  isLoading,
  error,
}: MissedBenefitsSectionProps) {
  // Don't render the section at all while the welfare card is also loading
  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text
          style={{
            color: Palette.textPrimary,
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 16,
          }}
        >
          Schemes you're missing
        </Text>
        <ActivityIndicator color={Palette.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ color: Palette.textSecondary, fontSize: 13 }}>{error}</Text>
      </View>
    );
  }

  if (!schemes || schemes.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
      {/* Section heading */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text
          style={{
            color: Palette.textPrimary,
            fontSize: 17,
            fontWeight: '700',
            flex: 1,
          }}
        >
          Schemes you're missing
        </Text>
        {/* Count badge */}
        <View
          style={{
            backgroundColor: Palette.errorA20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Palette.errorA40,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: Palette.error, fontSize: 12, fontWeight: '700' }}>
            {schemes.length}
          </Text>
        </View>
      </View>

      {schemes.map((scheme) => (
        <SchemeCard key={scheme.id} scheme={scheme} />
      ))}
    </View>
  );
}
