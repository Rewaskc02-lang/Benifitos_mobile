import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import type { MissedScheme } from '@/lib/api/services/welfareService';
import { usePalette } from '@/store/themeStore';

function formatINR(amount: number): string {
  return `\u20B9${amount.toLocaleString('en-IN')}`;
}

function SchemeCard({ scheme }: { scheme: MissedScheme }) {
  const P = usePalette();
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
      style={[styles.card, { backgroundColor: P.surface, borderColor: P.border }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.dot, { backgroundColor: P.error }]} />
        <Text style={[styles.name, { color: P.textPrimary }]}>{scheme.name}</Text>
        <View style={[styles.amountBadge, { backgroundColor: P.successA15, borderColor: P.successA30 }]}>
          <Text style={[styles.amountText, { color: P.success }]}>{formatINR(scheme.benefitAmount)}</Text>
        </View>
      </View>
      <Text style={[styles.reason, { color: P.textSecondary }]}>{scheme.reason}</Text>
    </TouchableOpacity>
  );
}

interface MissedBenefitsSectionProps {
  schemes: MissedScheme[] | null;
  isLoading: boolean;
  error: string | null;
}

export function MissedBenefitsSection({ schemes, isLoading, error }: MissedBenefitsSectionProps) {
  const P = usePalette();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: P.textPrimary }]}>Schemes you're missing</Text>
        <ActivityIndicator color={P.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[{ color: P.textSecondary, fontSize: 13 }]}>{error}</Text>
      </View>
    );
  }

  if (!schemes || schemes.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: P.textPrimary }]}>Schemes you're missing</Text>
        <View style={[styles.countBadge, { backgroundColor: P.errorA15, borderColor: P.errorA30 }]}>
          <Text style={[styles.countText, { color: P.error }]}>{schemes.length}</Text>
        </View>
      </View>
      {schemes.map((scheme) => (
        <SchemeCard key={scheme.id} scheme={scheme} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  amountBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  reason: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 18,
  },
});
