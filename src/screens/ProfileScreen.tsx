import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/authStore';
import { Palette } from '@/constants/theme';

// Sub-screens (loaded lazily via local state)
import { AccountSettingsScreen } from '@/screens/profile/AccountSettingsScreen';
import { NotificationsScreen } from '@/screens/profile/NotificationsScreen';
import { PrivacySecurityScreen } from '@/screens/profile/PrivacySecurityScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { AboutScreen } from '@/screens/profile/AboutScreen';
import { GraphVisualizer } from '@/screens/profile/GraphVisualizer';
import { MyDocumentsScreen } from '@/screens/profile/MyDocumentsScreen';

type SubScreen = 'account' | 'notifications' | 'privacy' | 'help' | 'about' | 'graph-visual' | 'documents' | null;

type ProfileRouteProp = RouteProp<BottomTabParamList, 'Profile'>;
type ProfileNavProp = BottomTabNavigationProp<BottomTabParamList, 'Profile'>;

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [activeScreen, setActiveScreen] = useState<SubScreen>(null);
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<ProfileNavProp>();

  // Detect and apply screen routing parameter
  useEffect(() => {
    if (route.params?.screen) {
      const screenParam = route.params.screen;
      Promise.resolve().then(() => {
        setActiveScreen(screenParam);
        navigation.setParams({ screen: undefined });
      });
    }
  }, [route.params?.screen, navigation]);

  // Render sub-screens inside the same ProfileScreen render cycle — no Stack needed
  if (activeScreen === 'account') return <AccountSettingsScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'notifications') return <NotificationsScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'privacy') return <PrivacySecurityScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'help') return <HelpSupportScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'about') return <AboutScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'graph-visual') return <GraphVisualizer onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'documents') return <MyDocumentsScreen onBack={() => setActiveScreen(null)} />;

  const menuItems: { label: string; icon: string; screen: SubScreen }[] = [
    { label: 'Account Settings', icon: '⚙️', screen: 'account' },
    { label: 'Notifications', icon: '🔔', screen: 'notifications' },
    { label: 'My Documents', icon: '📁', screen: 'documents' },
    { label: 'Privacy & Security', icon: '🔒', screen: 'privacy' },
    { label: 'My Welfare Network', icon: '🕸️', screen: 'graph-visual' },
    { label: 'Help & Support', icon: '❓', screen: 'help' },
    { label: 'About', icon: 'ℹ️', screen: 'about' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-text-primary text-3xl font-bold">Profile</Text>
        </View>

        {/* Avatar & Info */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4 shadow-lg">
            <Text className="text-white text-4xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text className="text-text-primary text-xl font-bold mb-1">
            {user?.name ?? 'User Name'}
          </Text>
          <Text className="text-text-secondary text-sm">
            {user?.email ?? 'user@example.com'}
          </Text>
          <View className="mt-3 px-4 py-1 rounded-full bg-primary/20 border border-primary/30">
            <Text className="text-primary text-xs font-semibold">BenefitOS Member</Text>
          </View>
        </View>

        {/* Stats — clickable shortcuts */}
        <View className="mx-6 flex-row gap-3 mb-8">
          {[
            { label: 'Schemes', value: '📋', onPress: () => navigation.navigate('Roadmap') },
            { label: 'Roadmap', value: '🗺️', onPress: () => navigation.navigate('Roadmap') },
            { label: 'Graph', value: '🔗', onPress: () => setActiveScreen('graph-visual') },
          ].map((s) => (
            <TouchableOpacity
              key={s.label}
              className="flex-1 rounded-2xl bg-background-card p-4 items-center"
              style={{ borderWidth: 1, borderColor: Palette.border }}
              activeOpacity={0.7}
              onPress={s.onPress}
            >
              <Text className="text-primary text-2xl font-bold">{s.value}</Text>
              <Text className="text-text-muted text-xs mt-1">{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu — now fully navigable */}
        <View className="mx-6 rounded-2xl bg-background-card overflow-hidden" style={{ borderWidth: 1, borderColor: Palette.border }}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center px-5 py-4"
              style={idx < menuItems.length - 1 ? { borderBottomWidth: 1, borderBottomColor: Palette.border } : {}}
              activeOpacity={0.7}
              onPress={() => setActiveScreen(item.screen)}
            >
              <Text className="text-lg mr-4">{item.icon}</Text>
              <Text className="flex-1 text-text-primary font-medium">{item.label}</Text>
              <Text className="text-text-muted text-base">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View className="mx-6 mt-4">
          <TouchableOpacity
            className="rounded-2xl bg-secondary/10 border border-secondary/20 py-4 items-center"
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text className="text-secondary font-semibold">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
