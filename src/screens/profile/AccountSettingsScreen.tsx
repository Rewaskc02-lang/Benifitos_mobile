import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Alert, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { authService } from '@/lib/api/services/authService';
import { useAuthStore } from '@/store/authStore';

interface Props { onBack: () => void; }

export function AccountSettingsScreen({ onBack }: Props) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      onBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, [onBack]);

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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Profile section */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Display Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Palette.textMuted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={s.hint}>This is how you appear across the app.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionLabel}>Email Address</Text>
          <View style={s.readonlyField}>
            <Text style={s.readonlyText}>{user?.email ?? '—'}</Text>
          </View>
          <Text style={s.hint}>Email cannot be changed at this time.</Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && s.btnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Palette.white} size="small" />
            : <Text style={s.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
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
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    padding: 20, marginBottom: 16,
  },
  sectionLabel: {
    color: Palette.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  input: {
    backgroundColor: Palette.background, borderWidth: 1,
    borderColor: Palette.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: Palette.textPrimary, fontSize: 16,
  },
  readonlyField: {
    backgroundColor: Palette.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  readonlyText: { color: Palette.textSecondary, fontSize: 15 },
  hint: { color: Palette.textMuted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  saveBtn: {
    backgroundColor: Palette.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Palette.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
