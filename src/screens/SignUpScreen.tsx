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
import { authService } from '@/lib/api/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Palette } from '@/constants/theme';

// Indian states for the dropdown hint
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

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
      // App will automatically navigate to MainTabs via RootNavigator's auth gate
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
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <Text style={styles.brandName}>Create Account</Text>
            <Text style={styles.tagline}>
              Join BenefitOS and discover your government benefits
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            {/* Required fields label */}
            <Text style={styles.sectionLabel}>Required</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Rajesh Kumar"
                placeholderTextColor={Palette.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Palette.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={Palette.textMuted}
                secureTextEntry
                returnKeyType="next"
              />
            </View>

            {/* Optional fields */}
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
              Optional — helps us find more benefits for you
            </Text>

            {/* Age + Income row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  placeholderTextColor={Palette.textMuted}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  maxLength={3}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Annual Income (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={income}
                  onChangeText={setIncome}
                  placeholder="180000"
                  placeholderTextColor={Palette.textMuted}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* State */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="e.g. Uttar Pradesh"
                placeholderTextColor={Palette.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            {/* Create account button */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Palette.white} size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Terms note */}
            <Text style={styles.termsNote}>
              By creating an account you agree to our terms of service.
              Your data is used solely for government benefit matching.
            </Text>
          </View>

          {/* Back to login */}
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
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  backIcon: {
    color: Palette.textSecondary,
    fontSize: 22,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.primaryA22,
    borderWidth: 2,
    borderColor: Palette.primaryA55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 28,
  },
  brandName: {
    color: Palette.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: Palette.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Palette.errorA15,
    borderWidth: 1,
    borderColor: Palette.errorA40,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorText: {
    color: Palette.error,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Palette.textPrimary,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  registerBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  termsNote: {
    color: Palette.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    color: Palette.textSecondary,
    fontSize: 14,
  },
  loginLinkAccent: {
    color: Palette.primary,
    fontWeight: '700',
  },
});
