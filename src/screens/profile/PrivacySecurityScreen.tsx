import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';
import { authService } from '@/lib/api/services/authService';

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props { onBack: () => void; }

export function PrivacySecurityScreen({ onBack }: Props) {
  const P = usePalette();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'New passwords do not match.'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await authService.changePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Password changed successfully.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to change password.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: P.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: P.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <BackIcon color={P.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: P.textPrimary }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionHeader, { color: P.textSecondary }]}>Change Password</Text>
        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          {[
            { label: 'Current Password', val: oldPw, set: setOldPw, placeholder: 'Enter current password' },
            { label: 'New Password', val: newPw, set: setNewPw, placeholder: 'Minimum 6 characters' },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, placeholder: 'Repeat new password' },
          ].map((f, i) => (
            <View key={f.label} style={i < 2 ? s.inputGroup : s.inputGroupLast}>
              <Text style={[s.inputLabel, { color: P.textMuted }]}>{f.label}</Text>
              <TextInput
                style={[s.input, { backgroundColor: P.background, borderColor: P.border, color: P.textPrimary }]}
                value={f.val}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={P.textMuted}
                secureTextEntry
                returnKeyType={i < 2 ? 'next' : 'done'}
                onSubmitEditing={i === 2 ? handleChangePassword : undefined}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: P.primary }, saving && s.btnDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={P.white} size="small" />
              : <Text style={[s.saveBtnText, { color: P.white }]}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionHeader, { color: P.textSecondary }]}>Data We Store</Text>
        <View style={[s.card, { backgroundColor: P.surface, borderColor: P.border }]}>
          <Text style={[s.privacyText, { color: P.textSecondary }]}>
            BenefitOS stores the following data in a Neo4j graph database:{'\n\n'}
            {'• '}Name, email address, and hashed password{'\n'}
            {'• '}Age, annual income, and home state{'\n'}
            {'• '}Life stage (e.g. Student, Farmer, Senior Citizen){'\n'}
            {'• '}Document names you have marked as available{'\n'}
            {'• '}Family relationships within your household{'\n\n'}
            We do not sell your data to third parties or collect device identifiers.
          </Text>
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
  sectionHeader: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputGroupLast: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  privacyText: { fontSize: 13, lineHeight: 21 },
});
