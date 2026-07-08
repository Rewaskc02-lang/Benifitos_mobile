import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RoadmapScreen } from '@/screens/RoadmapScreen';
import { AssistantScreen } from '@/screens/AssistantScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/api/services/authService';
import { Palette } from '@/constants/theme';

export type BottomTabParamList = {
  Home: undefined;
  Profile: { screen?: 'account' | 'notifications' | 'privacy' | 'help' | 'about' | 'graph-visual' | 'documents' } | undefined;
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
  const { isAuthenticated, setToken, setUser, logout } = useAuthStore();
  const [sessionRestored, setSessionRestored] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUser = await SecureStore.getItemAsync('auth_user');
        
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.warn("Failed to parse stored user:", e);
            }
          }
          
          // Instantly boot if we have a token
          setSessionRestored(true);
          
          // Refresh user session in background
          try {
            const freshUser = await authService.getMe();
            setUser(freshUser);
          } catch (err: any) {
            console.log("[RootNavigator] Background profile sync skipped:", err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
              logout();
            }
          }
        } else {
          setSessionRestored(true);
        }
      } catch (err) {
        console.warn("Restoring token failed, clearing storage:", err);
        logout();
        setSessionRestored(true);
      }
    }
    restore();
  }, [setToken, setUser, logout]);

  if (!sessionRestored) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.background }}>
        <ActivityIndicator color={Palette.primary} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (showSignUp) {
      return <SignUpScreen onNavigateToLogin={() => setShowSignUp(false)} />;
    }
    return <LoginScreen onNavigateToSignUp={() => setShowSignUp(true)} />;
  }

  return <MainTabs />;
}
