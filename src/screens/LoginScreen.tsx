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

interface Props {
  onNavigateToSignUp: () => void;
}

export function LoginScreen({ onNavigateToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken } = useAuthStore();

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const loginEmail = overrideEmail ?? email.trim().toLowerCase();
    const loginPassword = overridePassword ?? password;

    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email: loginEmail, password: loginPassword });
      setToken(response.token);
      setUser(response.user);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Login failed. Check your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login({
        email: 'rajesh@benefitos.dev',
        password: 'password123',
      });
      setToken(response.token);
      setUser(response.user);
    } catch (loginErr) {
      console.log('[Demo Login] User rajesh@benefitos.dev not found, attempting auto-registration...');
      try {
        const regResponse = await authService.register({
          name: 'Rajesh Kumar',
          email: 'rajesh@benefitos.dev',
          password: 'password123',
          age: '21',
          income: '180000',
          state: 'Uttar Pradesh',
        });
        setToken(regResponse.token);
        setUser(regResponse.user);
      } catch (regErr: any) {
        const msg =
          regErr?.response?.data?.error ??
          regErr?.message ??
          'Demo access failed. Please try signing up manually.';
        setError(msg);
      }
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
          {/* Logo / Brand */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <Text style={styles.brandName}>BenefitOS</Text>
            <Text style={styles.tagline}>Your Government Benefits, Simplified</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to access your welfare dashboard</Text>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

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
                placeholder="••••••••"
                placeholderTextColor={Palette.textMuted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={() => handleLogin()}
              />
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={() => handleLogin()}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Palette.white} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo shortcut */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleDemoLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.demoBtnText}>🚀  Continue as Rajesh Kumar</Text>
              <Text style={styles.demoBtnSub}>Demo account — instant access</Text>
            </TouchableOpacity>

            {/* Sign up link */}
            <TouchableOpacity
              style={styles.signUpLink}
              onPress={onNavigateToSignUp}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.signUpLinkText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLinkAccent}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={styles.footer}>
            Built for Hackathon 2024 · Neo4j Graph Intelligence
          </Text>
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
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.primaryA22,
    borderWidth: 2,
    borderColor: Palette.primaryA55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 36,
  },
  brandName: {
    color: Palette.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    color: Palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    color: Palette.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: Palette.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
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
    paddingVertical: 14,
    color: Palette.textPrimary,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  dividerText: {
    color: Palette.textMuted,
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  demoBtn: {
    backgroundColor: Palette.primaryA12,
    borderWidth: 1,
    borderColor: Palette.primaryA44,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  demoBtnText: {
    color: Palette.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  demoBtnSub: {
    color: Palette.textMuted,
    fontSize: 12,
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpLinkText: {
    color: Palette.textSecondary,
    fontSize: 14,
  },
  signUpLinkAccent: {
    color: Palette.primary,
    fontWeight: '700',
  },
  footer: {
    color: Palette.border,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
