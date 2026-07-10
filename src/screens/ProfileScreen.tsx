import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useAuthStore } from '@/store/authStore';
import { usePalette, useThemeStore } from '@/store/themeStore';
import { AccountSettingsScreen } from '@/screens/profile/AccountSettingsScreen';
import { NotificationsScreen } from '@/screens/profile/NotificationsScreen';
import { PrivacySecurityScreen } from '@/screens/profile/PrivacySecurityScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { AboutScreen } from '@/screens/profile/AboutScreen';

type SubScreen = 'account' | 'notifications' | 'privacy' | 'help' | 'about' | null;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UserIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function SettingsIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      <Path d="M19.4 15C19.2 15.4 19.3 15.9 19.6 16.3L19.7 16.4C20 16.7 20.1 17.1 20.1 17.5C20.1 17.9 19.9 18.3 19.7 18.6C19.4 18.9 19 19.1 18.6 19.1C18.2 19.1 17.8 18.9 17.5 18.6L17.4 18.5C17 18.2 16.5 18.1 16.1 18.3C15.7 18.5 15.5 18.9 15.5 19.3V19.5C15.5 20.3 14.8 21 14 21H10C9.2 21 8.5 20.3 8.5 19.5V19.3C8.5 18.9 8.3 18.5 7.9 18.3C7.5 18.1 7 18.2 6.6 18.5L6.5 18.6C6.2 18.9 5.8 19.1 5.4 19.1C5 19.1 4.6 18.9 4.3 18.6C4 18.3 3.9 17.9 3.9 17.5C3.9 17.1 4.1 16.7 4.4 16.4L4.5 16.3C4.8 15.9 4.9 15.4 4.7 15C4.5 14.6 4.1 14.4 3.7 14.4H3.5C2.7 14.4 2 13.7 2 12.9V11.1C2 10.3 2.7 9.6 3.5 9.6H3.7C4.1 9.6 4.5 9.4 4.7 9C4.9 8.6 4.8 8.1 4.5 7.7L4.4 7.6C4.1 7.3 3.9 6.9 3.9 6.5C3.9 6.1 4.1 5.7 4.3 5.4C4.6 5.1 5 4.9 5.4 4.9C5.8 4.9 6.2 5.1 6.5 5.4L6.6 5.5C7 5.8 7.5 5.9 7.9 5.7C8.3 5.5 8.5 5.1 8.5 4.7V4.5C8.5 3.7 9.2 3 10 3H14C14.8 3 15.5 3.7 15.5 4.5V4.7C15.5 5.1 15.7 5.5 16.1 5.7C16.5 5.9 17 5.8 17.4 5.5L17.5 5.4C17.8 5.1 18.2 4.9 18.6 4.9C19 4.9 19.4 5.1 19.7 5.4C20 5.7 20.1 6.1 20.1 6.5C20.1 6.9 19.9 7.3 19.6 7.6L19.5 7.7C19.2 8.1 19.1 8.6 19.3 9C19.5 9.4 19.9 9.6 20.3 9.6H20.5C21.3 9.6 22 10.3 22 11.1V12.9C22 13.7 21.3 14.4 20.5 14.4H20.3C19.9 14.4 19.5 14.6 19.4 15Z" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function BellIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8C18 6.4 17.4 4.8 16.2 3.6C15 2.4 13.5 2 12 2C10.5 2 9 2.4 7.8 3.6C6.6 4.8 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.7 21C13.5 21.3 13.3 21.6 12.9 21.8C12.5 22 12.3 22 12 22C11.7 22 11.5 22 11.1 21.8C10.7 21.6 10.5 21.3 10.3 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function HelpCircleIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9.09 9C9.33 8.31 9.82 7.72 10.46 7.34C11.1 6.96 11.86 6.83 12.59 6.97C13.32 7.1 13.99 7.49 14.45 8.07C14.91 8.64 15.14 9.37 15 10.09C14.72 11.52 13 12 13 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function InfoIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function LogOutIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function SunIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.8} />
      <Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function MoonIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79C20.84 14.07 20.31 15.29 19.46 16.28C18.61 17.28 17.5 18.01 16.25 18.39C15 18.76 13.68 18.76 12.43 18.38C11.18 18.01 10.07 17.28 9.22 16.28C8.37 15.28 7.84 14.06 7.68 12.78C7.52 11.5 7.74 10.2 8.31 9.04C8.88 7.88 9.77 6.91 10.88 6.25C11.99 5.58 13.28 5.24 14.57 5.27C13.73 6.3 13.3 7.6 13.37 8.93C13.43 10.25 13.98 11.5 14.93 12.44C15.87 13.39 17.12 13.94 18.44 14C19.77 14.07 21.07 13.64 22.1 12.8L21 12.79Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const P = usePalette();
  const { colorScheme, toggleTheme } = useThemeStore();
  const [activeScreen, setActiveScreen] = useState<SubScreen>(null);

  if (activeScreen === 'account') return <AccountSettingsScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'notifications') return <NotificationsScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'privacy') return <PrivacySecurityScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'help') return <HelpSupportScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'about') return <AboutScreen onBack={() => setActiveScreen(null)} />;

  const menuItems = [
    { label: 'Account Settings', icon: <SettingsIcon color={P.primary} />, screen: 'account' as SubScreen },
    { label: 'Notifications', icon: <BellIcon color={P.primary} />, screen: 'notifications' as SubScreen },
    { label: 'Privacy & Security', icon: <LockIcon color={P.primary} />, screen: 'privacy' as SubScreen },
    { label: 'Help & Support', icon: <HelpCircleIcon color={P.primary} />, screen: 'help' as SubScreen },
    { label: 'About BenefitOS', icon: <InfoIcon color={P.primary} />, screen: 'about' as SubScreen },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header banner */}
        <View style={[styles.banner, { backgroundColor: P.primary }]}>
          <Text style={styles.bannerTitle}>Profile</Text>
        </View>

        {/* Avatar card */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.avatarCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: P.primaryA20, borderColor: P.primaryA30 }]}>
              <Text style={[styles.avatarInitials, { color: P.primary }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: P.textPrimary }]}>
                {user?.name ?? 'Citizen'}
              </Text>
              <Text style={[styles.userEmail, { color: P.textMuted }]}>
                {user?.email ?? ''}
              </Text>
              <View style={[styles.memberBadge, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
                <Text style={[styles.memberBadgeText, { color: P.primary }]}>BenefitOS Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dark mode toggle */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={[styles.themeRow, { backgroundColor: P.surface, borderColor: P.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {colorScheme === 'dark' ? <MoonIcon color={P.primary} /> : <SunIcon color={P.primary} />}
              <View>
                <Text style={[styles.themeLabel, { color: P.textPrimary }]}>
                  {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.themeSub, { color: P.textMuted }]}>
                  Tap to switch theme
                </Text>
              </View>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: P.border, true: P.primaryA50 }}
              thumbColor={colorScheme === 'dark' ? P.primary : P.textMuted}
            />
          </View>
        </View>

        {/* Menu */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={[styles.menuCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuRow,
                  idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: P.border },
                ]}
                onPress={() => setActiveScreen(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: P.primaryA10 }]}>
                  {item.icon}
                </View>
                <Text style={[styles.menuLabel, { color: P.textPrimary }]}>{item.label}</Text>
                <ChevronRightIcon color={P.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: P.errorA15, borderColor: P.errorA30 }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <LogOutIcon color={P.error} />
            <Text style={[styles.logoutText, { color: P.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 44,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: -24,
    gap: 16,
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSub: {
    fontSize: 12,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
