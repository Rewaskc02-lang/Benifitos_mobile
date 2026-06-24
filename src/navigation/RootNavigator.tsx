import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RoadmapScreen } from '@/screens/RoadmapScreen';
import { AssistantScreen } from '@/screens/AssistantScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useAuthStore } from '@/store/authStore';
import { Palette } from '@/constants/theme';

export type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
  Roadmap: undefined;
  Assistant: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Hide the tab bar when the keyboard is open on Android.
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarStyle: {
          backgroundColor: Palette.surface,
          borderTopColor: Palette.border,
          borderTopWidth: 1,
          // Dynamically grow to accommodate the phone's gesture bar
          height: 56 + (insets.bottom > 0 ? insets.bottom : 12),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Roadmap" component={RoadmapScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();
  // Local state to toggle between Login and SignUp screens when unauthenticated.
  // Keeping this as local state (not a Stack navigator) so we don't need to add
  // a new Stack dependency just for two unauthenticated screens.
  const [showSignUp, setShowSignUp] = useState(false);

  if (!isAuthenticated) {
    if (showSignUp) {
      return <SignUpScreen onNavigateToLogin={() => setShowSignUp(false)} />;
    }
    return <LoginScreen onNavigateToSignUp={() => setShowSignUp(true)} />;
  }

  return <MainTabs />;
}
