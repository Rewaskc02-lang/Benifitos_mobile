import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePalette } from '@/store/themeStore';

const STORAGE_KEY = '@benefitos_notifications';

type Pref = { key: string; label: string; description: string };

const PREFS: Pref[] = [
  { key: 'scheme_alerts', label: 'New Scheme Alerts', description: 'Notify when new schemes match your profile' },
  { key: 'document_reminders', label: 'Document Reminders', description: 'Remind you to upload or renew documents' },
  { key: 'weekly_digest', label: 'Weekly Digest', description: 'A weekly summary of your welfare score' },
  { key: 'application_updates', label: 'Application Updates', description: 'Status changes on your applications' },
  { key: 'family_alerts', label: 'Family Alerts', description: 'Schemes found for household members' },
];

const DEFAULT: Record<string, boolean> = {
  scheme_alerts: true, document_reminders: true,
  weekly_digest: false, application_updates: true, family_alerts: true,
};

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props { onBack: () => void; }

export function NotificationsScreen({ onBack }: Props) {
  const P = usePalette();
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
    <SafeAreaView style={[s.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: P.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: P.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={[s.infoBox, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.infoText, { color: P.textMuted }]}>
            Preferences are saved locally. Notifications require a production build installed on your device.
          </Text>
        </View>

        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          {PREFS.map((pref, idx) => (
            <View
              key={pref.key}
              style={[
                s.row,
                idx < PREFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: P.border },
              ]}
            >
              <View style={s.rowText}>
                <Text style={[s.rowLabel, { color: P.textPrimary }]}>{pref.label}</Text>
                <Text style={[s.rowDesc, { color: P.textSecondary }]}>{pref.description}</Text>
              </View>
              <Switch
                value={ready ? prefs[pref.key] : false}
                onValueChange={() => toggle(pref.key)}
                trackColor={{ false: P.border, true: P.primaryA50 }}
                thumbColor={prefs[pref.key] ? P.primary : P.textMuted}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  body: { padding: 24, paddingBottom: 48 },
  infoBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20 },
  infoText: { fontSize: 12, lineHeight: 18 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15 },
  rowText: { flex: 1, marginRight: 14 },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rowDesc: { fontSize: 12, lineHeight: 17 },
});
