import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { authService } from '@/lib/api/services/authService';

interface Props { onBack: () => void; }

export function PrivacySecurityScreen({ onBack }: Props) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all fields.'); return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.'); return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.'); return;
    }
    setSaving(true);
    try {
      await authService.changePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Your password has been changed successfully.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Change Password */}
        <Text style={s.sectionHeader}>Change Password</Text>
        <View style={s.card}>
          {[
            { label: 'Current Password', val: oldPw, set: setOldPw, placeholder: '••••••••' },
            { label: 'New Password', val: newPw, set: setNewPw, placeholder: 'Minimum 6 characters' },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, placeholder: '••••••••' },
          ].map((f, i) => (
            <View key={f.label} style={i < 2 ? s.inputGroup : s.inputGroupLast}>
              <Text style={s.inputLabel}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={f.val}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={Palette.textMuted}
                secureTextEntry
                returnKeyType={i < 2 ? 'next' : 'done'}
                onSubmitEditing={i === 2 ? handleChangePassword : undefined}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[s.saveBtn, saving && s.btnDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={Palette.white} size="small" />
              : <Text style={s.saveBtnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        {/* What data we store */}
        <Text style={s.sectionHeader}>What Data We Store</Text>
        <View style={s.card}>
          <Text style={s.privacyText}>
            BenefitOS stores the following data about you in a Neo4j graph database hosted on your
            own self-managed instance:{'\n\n'}
            {'• '}Name, email address, and a bcrypt-hashed password{'\n'}
            {'• '}Age, annual income bracket, and home state{'\n'}
            {'• '}Life stage (e.g. Student, Farmer, Senior Citizen){'\n'}
            {'• '}Names of documents you have marked as available{'\n'}
            {'• '}Family relationships, if you belong to a household group{'\n\n'}
            We do not sell your data to any third parties. We do not collect
            device identifiers, location, or usage analytics. All data is used
            solely to match you with relevant government welfare schemes.{'\n\n'}
            There is no client-side encryption of stored data at this time. Your
            data security depends on the security of your backend deployment.
          </Text>
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
  sectionHeader: {
    color: Palette.textSecondary, fontSize: 13, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 12, marginTop: 8,
  },
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    padding: 20, marginBottom: 24,
  },
  inputGroup: { marginBottom: 16 },
  inputGroupLast: { marginBottom: 20 },
  inputLabel: {
    color: Palette.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.background, borderWidth: 1,
    borderColor: Palette.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: Palette.textPrimary, fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Palette.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Palette.white, fontSize: 15, fontWeight: '700' },
  privacyText: { color: Palette.textSecondary, fontSize: 13, lineHeight: 21 },
});
