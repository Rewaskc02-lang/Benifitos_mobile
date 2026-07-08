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

const STATES = ['Uttar Pradesh', 'Karnataka', 'Delhi', 'Maharashtra', 'Tamil Nadu'];
const STAGES = ['Student', 'Graduate', 'Worker', 'Farmer', 'Homemaker', 'Senior Citizen'];

export function AccountSettingsScreen({ onBack }: Props) {
  const { user, setUser } = useAuthStore();

  // Form states
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [income, setIncome] = useState(user?.income !== undefined && user?.income !== null ? String(user.income) : '');
  const [state, setState] = useState(user?.state ?? 'Uttar Pradesh');
  const [stage, setStage] = useState(user?.stage ?? user?.lifeStage ?? 'Student');
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
    if (!age.trim() || isNaN(Number(age))) { Alert.alert('Error', 'Please enter a valid age'); return; }
    if (!income.trim() || isNaN(Number(income))) { Alert.alert('Error', 'Please enter a valid income'); return; }

    setSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        age: Number(age),
        income: Number(income),
        state,
        stage,
      });

      setUser(updatedUser);
      Alert.alert('Saved Success 🎉', 'Your profile details have been updated and graph benefits re-evaluated.', [
        { text: 'OK', onPress: onBack }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save changes. Please check your connection.');
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
        {/* Name Input */}
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
          />
        </View>

        {/* Age and Income */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Age & Income metrics</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.subLabel}>Age (years)</Text>
              <TextInput
                style={s.input}
                value={age}
                onChangeText={setAge}
                placeholder="21"
                placeholderTextColor={Palette.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
            <View style={{ flex: 2.2 }}>
              <Text style={s.subLabel}>Annual Income (₹)</Text>
              <TextInput
                style={s.input}
                value={income}
                onChangeText={setIncome}
                placeholder="150000"
                placeholderTextColor={Palette.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* State Selection */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Resident State</Text>
          <View style={s.chipRow}>
            {STATES.map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setState(st)}
                style={[s.chip, state === st && s.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, state === st && s.chipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Life Stage Selection */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Current Life Stage</Text>
          <View style={s.chipRow}>
            {STAGES.map((sg) => (
              <TouchableOpacity
                key={sg}
                onPress={() => setStage(sg)}
                style={[s.chip, stage === sg && s.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, stage === sg && s.chipTextActive]}>{sg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Family Node linkage (Readonly) */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Family linkage</Text>
          <View style={s.readonlyField}>
            <Text style={s.readonlyText}>Kumar Household 👥</Text>
          </View>
          <Text style={s.hint}>Linked in backend Neo4j welfare graph matrix.</Text>
        </View>

        {/* Email Node (Readonly) */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Email Address</Text>
          <View style={s.readonlyField}>
            <Text style={s.readonlyText}>{user?.email ?? '—'}</Text>
          </View>
          <Text style={s.hint}>Email cannot be changed.</Text>
        </View>

        {/* Action Button */}
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
  body: { padding: 20, paddingBottom: 48 },
  card: {
    backgroundColor: Palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Palette.border,
    padding: 16, marginBottom: 16,
  },
  sectionLabel: {
    color: Palette.textSecondary, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  subLabel: {
    fontSize: 12, color: Palette.textMuted, marginBottom: 6, fontWeight: '600'
  },
  input: {
    backgroundColor: Palette.background, borderWidth: 1,
    borderColor: Palette.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    color: Palette.textPrimary, fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
  },
  chipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Palette.white,
  },
  readonlyField: {
    backgroundColor: Palette.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  readonlyText: { color: Palette.textSecondary, fontSize: 14, fontWeight: '600' },
  hint: { color: Palette.textMuted, fontSize: 11, marginTop: 6, lineHeight: 16 },
  saveBtn: {
    backgroundColor: Palette.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Palette.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
