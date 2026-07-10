import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';
import { authService } from '@/lib/api/services/authService';
import { useAuthStore } from '@/store/authStore';

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props { onBack: () => void; }

export function AccountSettingsScreen({ onBack }: Props) {
  const P = usePalette();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    if (name.trim() === user?.name) { onBack(); return; }
    setSaving(true);
    try {
      const updated = await authService.updateName(name.trim());
      setUser({ ...user!, name: updated.name });
      Alert.alert('Saved', 'Your name has been updated.', [{ text: 'OK', onPress: onBack }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: P.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: P.textPrimary }]}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.sectionLabel, { color: P.textMuted }]}>Display Name</Text>
          <TextInput
            style={[s.input, { backgroundColor: P.background, borderColor: P.border, color: P.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={P.textMuted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={[s.hint, { color: P.textMuted }]}>This is how you appear across the app.</Text>
        </View>

        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.sectionLabel, { color: P.textMuted }]}>Email Address</Text>
          <View style={[s.readonlyField, { backgroundColor: P.border }]}>
            <Text style={[s.readonlyText, { color: P.textSecondary }]}>{user?.email ?? '—'}</Text>
          </View>
          <Text style={[s.hint, { color: P.textMuted }]}>Email cannot be changed at this time.</Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: P.primary }, saving && s.btnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={P.white} size="small" />
            : <Text style={[s.saveBtnText, { color: P.white }]}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  body: { padding: 24, paddingBottom: 48 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  readonlyField: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  readonlyText: { fontSize: 15 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
