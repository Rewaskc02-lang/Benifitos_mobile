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
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { authService } from '@/lib/api/services/authService';
import { useAuthStore } from '@/store/authStore';
import { LightPalette as P } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Icons (inline SVG — no emoji)
// ---------------------------------------------------------------------------

function ShieldIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        fill={P.primary}
        opacity={0.15}
      />
      <Path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        stroke={P.primary}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={P.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={P.textMuted} strokeWidth={1.8} />
      <Path
        d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11"
        stroke={P.textMuted}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={P.textMuted} strokeWidth={1.8} />
      <Path d="M2 7L12 14L22 7" stroke={P.textMuted} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={P.textInverse} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Aadhaar OTP panel (modular — plug real API later)
// ---------------------------------------------------------------------------

function AadhaarPanel({ onClose }: { onClose: () => void }) {
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'number' | 'otp'>('number');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    const digits = aadhaar.replace(/\s/g, '');
    if (digits.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setLoading(true);
    setError(null);
    // Simulate API call — replace with real UIDAI OTP initiation
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep('otp');
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError(null);
    // Simulate verification — replace with real UIDAI verification
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setError('Aadhaar authentication is in demo mode. Use email login for full access.');
  };

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  };

  return (
    <View style={styles.aadhaarPanel}>
      <View style={styles.aadhaarHeader}>
        <Text style={styles.aadhaarTitle}>Aadhaar Verification</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {step === 'number' ? (
        <>
          <Text style={styles.aadhaarLabel}>Enter Aadhaar Number</Text>
          <TextInput
            style={styles.aadhaarInput}
            value={aadhaar}
            onChangeText={(v) => setAadhaar(formatAadhaar(v))}
            placeholder="XXXX XXXX XXXX"
            placeholderTextColor={P.textMuted}
            keyboardType="number-pad"
            maxLength={14}
          />
          <Text style={styles.aadhaarNote}>
            An OTP will be sent to your Aadhaar-linked mobile number.
          </Text>
          <TouchableOpacity
            style={[styles.aadhaarBtn, loading && styles.btnDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={P.white} size="small" />
            ) : (
              <Text style={styles.aadhaarBtnText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.aadhaarLabel}>Enter OTP</Text>
          <TextInput
            style={[styles.aadhaarInput, { letterSpacing: 8, textAlign: 'center' }]}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • • • •"
            placeholderTextColor={P.textMuted}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Text style={styles.aadhaarNote}>
            OTP sent to Aadhaar-linked mobile. Valid for 10 minutes.
          </Text>
          <TouchableOpacity
            style={[styles.aadhaarBtn, loading && styles.btnDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={P.white} size="small" />
            ) : (
              <Text style={styles.aadhaarBtnText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep('number')}
            style={{ alignItems: 'center', marginTop: 12 }}
          >
            <Text style={{ color: P.primary, fontSize: 13 }}>Change Aadhaar Number</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main LoginScreen
// ---------------------------------------------------------------------------

interface Props {
  onNavigateToSignUp: () => void;
}

export function LoginScreen({ onNavigateToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAadhaar, setShowAadhaar] = useState(false);

  const { setUser, setToken } = useAuthStore();

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const loginEmail = overrideEmail ?? email.trim().toLowerCase();
    const loginPassword = overridePassword ?? password;

    if (!loginEmail || !loginPassword) {
      setError('Please enter your email address and password.');
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
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showAadhaar) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <AadhaarPanel onClose={() => setShowAadhaar(false)} />
      </SafeAreaView>
    );
  }

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
          {/* Header banner */}
          <View style={styles.headerBanner}>
            <View style={styles.govBadge}>
              <Text style={styles.govBadgeText}>GOVERNMENT OF INDIA</Text>
            </View>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <ShieldIcon />
              </View>
              <View>
                <Text style={styles.brandName}>BenefitOS</Text>
                <Text style={styles.brandSub}>Welfare Intelligence Platform</Text>
              </View>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Citizen Login</Text>
            <Text style={styles.cardSubtitle}>
              Access your personalised government benefit dashboard
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <MailIcon />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="citizen@example.com"
                  placeholderTextColor={P.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <LockIcon />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={P.textMuted}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={() => handleLogin()}
                />
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={() => handleLogin()}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={P.white} size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <ChevronRightIcon />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Aadhaar login */}
            <TouchableOpacity
              style={styles.aadhaarLoginBtn}
              onPress={() => setShowAadhaar(true)}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.aadhaarLoginText}>Login with Aadhaar OTP</Text>
              <View style={styles.aadhaarBadge}>
                <Text style={styles.aadhaarBadgeText}>UIDAI</Text>
              </View>
            </TouchableOpacity>

            {/* Demo shortcut */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleLogin('rajesh@benefitos.dev', 'password123')}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.demoBtnText}>Continue as Demo Citizen</Text>
              <Text style={styles.demoBtnSub}>Rajesh Kumar — instant access</Text>
            </TouchableOpacity>

            {/* Sign up */}
            <TouchableOpacity
              style={styles.signUpLink}
              onPress={onNavigateToSignUp}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.signUpLinkText}>
                New citizen?{' '}
                <Text style={styles.signUpLinkAccent}>Register here</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Ministry of Electronics and Information Technology{'\n'}
            Government of India — Secure Portal
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: P.primary,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  govBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  govBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: P.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: P.surface,
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.border,
    padding: 24,
    marginBottom: 20,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    color: P.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: P.textSecondary,
    fontSize: 13,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: P.errorA15,
    borderWidth: 1,
    borderColor: P.errorA30,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorText: {
    color: P.error,
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: P.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.background,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
  inputIcon: {
    width: 32,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    color: P.textPrimary,
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: P.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: P.white,
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
    backgroundColor: P.border,
  },
  dividerText: {
    color: P.textMuted,
    fontSize: 11,
    marginHorizontal: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aadhaarLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.background,
    borderWidth: 1.5,
    borderColor: P.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  aadhaarLoginText: {
    color: P.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  aadhaarBadge: {
    backgroundColor: P.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aadhaarBadgeText: {
    color: P.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  demoBtn: {
    backgroundColor: P.accentA15,
    borderWidth: 1,
    borderColor: P.accentA40,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  demoBtnText: {
    color: P.accent,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  demoBtnSub: {
    color: P.textMuted,
    fontSize: 12,
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpLinkText: {
    color: P.textSecondary,
    fontSize: 14,
  },
  signUpLinkAccent: {
    color: P.primary,
    fontWeight: '700',
  },
  footer: {
    color: P.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  // Aadhaar panel
  aadhaarPanel: {
    flex: 1,
    backgroundColor: P.background,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  aadhaarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  aadhaarTitle: {
    color: P.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: P.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  aadhaarLabel: {
    color: P.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aadhaarInput: {
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: P.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 10,
  },
  aadhaarNote: {
    color: P.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },
  aadhaarBtn: {
    backgroundColor: P.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  aadhaarBtnText: {
    color: P.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
