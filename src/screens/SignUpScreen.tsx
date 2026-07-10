import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { authService } from '@/lib/api/services/authService';
import { useAuthStore } from '@/store/authStore';
import { LightPalette as P } from '@/constants/theme';

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill={P.primary} opacity={0.15} />
      <Path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke={P.primary} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 12L11 14L15 10" stroke={P.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props {
  onNavigateToLogin: () => void;
}

export function SignUpScreen({ onNavigateToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken } = useAuthStore();

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { setError('Please enter your full name.'); return; }
    if (!trimmedEmail || !trimmedEmail.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        age: age || undefined,
        income: income || undefined,
        state: state || undefined,
      });
      setToken(response.token);
      setUser(response.user);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
            >
              <BackIcon color={P.textSecondary} />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <View style={styles.logoCircle}>
                <ShieldIcon />
              </View>
              <View>
                <Text style={styles.brandName}>Create Account</Text>
                <Text style={styles.brandSub}>BenefitOS — Welfare Platform</Text>
              </View>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Required Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Rajesh Kumar"
                placeholderTextColor={P.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="citizen@example.com"
                placeholderTextColor={P.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={P.textMuted}
                secureTextEntry
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
              Optional — helps us find more benefits
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  placeholderTextColor={P.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Annual Income (Rs.)</Text>
                <TextInput
                  style={styles.input}
                  value={income}
                  onChangeText={setIncome}
                  placeholder="180000"
                  placeholderTextColor={P.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="e.g. Uttar Pradesh"
                placeholderTextColor={P.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={P.white} size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsNote}>
              By creating an account you agree to our terms of service.
              Your data is used solely for government benefit matching.
            </Text>
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin} activeOpacity={0.7}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingTop: 20, paddingBottom: 24 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 0, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: P.primaryA10, borderWidth: 1.5, borderColor: P.primaryA30,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { color: P.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  brandSub: { color: P.textMuted, fontSize: 12 },
  card: {
    backgroundColor: P.surface, borderRadius: 20, borderWidth: 1, borderColor: P.border,
    padding: 24, marginBottom: 20,
    shadowColor: P.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  errorBanner: {
    backgroundColor: P.errorA15, borderWidth: 1, borderColor: P.errorA30,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
  },
  errorText: { color: P.error, fontSize: 13, lineHeight: 18 },
  sectionLabel: {
    color: P.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 16,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    color: P.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
    marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: P.background, borderWidth: 1, borderColor: P.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: P.textPrimary, fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  registerBtn: {
    backgroundColor: P.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    marginTop: 20, shadowColor: P.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: P.white, fontSize: 16, fontWeight: '700' },
  termsNote: {
    color: P.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 16,
  },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { color: P.textSecondary, fontSize: 14 },
  loginLinkAccent: { color: P.primary, fontWeight: '700' },
});
