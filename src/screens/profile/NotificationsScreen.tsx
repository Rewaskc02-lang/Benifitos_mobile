import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette } from '@/constants/theme';

const STORAGE_KEY = '@benefitos_notifications';

type Pref = { key: string; label: string; description: string };

const PREFS: Pref[] = [
  {
    key: 'scheme_alerts',
    label: 'New Scheme Alerts',
    description: 'Notify when new government schemes match your profile',
  },
  {
    key: 'document_reminders',
    label: 'Document Reminders',
    description: 'Remind you to upload or renew expiring documents',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'A weekly summary of your welfare score progress',
  },
  {
    key: 'application_updates',
    label: 'Application Updates',
    description: 'Status changes on schemes you have applied for',
  },
  {
    key: 'family_alerts',
    label: 'Family Member Alerts',
    description: 'Notify when new schemes are found for your household members',
  },
];

const DEFAULT: Record<string, boolean> = {
  scheme_alerts: true,
  document_reminders: true,
  weekly_digest: false,
  application_updates: true,
  family_alerts: true,
};

interface Props { onBack: () => void; }

export function NotificationsScreen({ onBack }: Props) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setPrefs(JSON.parse(val));
      setReady(true);
    });
  }, []);

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>
          Preferences are saved locally on this device. Actual notifications require
          the app to be installed via a production build (not Expo Go).
        </Text>

        <View style={s.card}>
          {PREFS.map((pref, idx) => (
            <View
              key={pref.key}
              style={[
                s.row,
                idx < PREFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Palette.border },
              ]}
            >
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{pref.label}</Text>
                <Text style={s.rowDesc}>{pref.description}</Text>
              </View>
              <Switch
                value={ready ? prefs[pref.key] : false}
                onValueChange={() => toggle(pref.key)}
                trackColor={{ false: Palette.border, true: Palette.primaryA55 }}
                thumbColor={prefs[pref.key] ? Palette.primary : Palette.textMuted}
                ios_backgroundColor={Palette.border}
              />
            </View>
          ))}
        </View>
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
  intro: {
    color: Palette.textMuted, fontSize: 12, lineHeight: 18,
    marginBottom: 20,
    backgroundColor: Palette.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Palette.border,
  },
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  rowText: { flex: 1, marginRight: 16 },
  rowLabel: { color: Palette.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rowDesc: { color: Palette.textSecondary, fontSize: 12, lineHeight: 17 },
});
