import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RoadmapScreen } from '@/screens/RoadmapScreen';
import { AssistantScreen } from '@/screens/AssistantScreen';
import { SchemesScreen } from '@/screens/SchemesScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { useAuthStore } from '@/store/authStore';
import { usePalette } from '@/store/themeStore';

export type BottomTabParamList = {
  Home: undefined;
  Schemes: undefined;
  Roadmap: undefined;
  Assistant: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// ---------------------------------------------------------------------------
// Tab icons (inline SVG — no emoji, no external deps)
// ---------------------------------------------------------------------------

type IconProps = { color: string; size: number; focused: boolean };

function HomeIcon({ color, size, focused }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? `${color}18` : 'none'}
      />
    </Svg>
  );
}

function GridIcon({ color, size, focused }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={focused ? 2.2 : 1.8} fill={focused ? `${color}18` : 'none'} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={focused ? 2.2 : 1.8} fill={focused ? `${color}18` : 'none'} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={focused ? 2.2 : 1.8} fill={focused ? `${color}18` : 'none'} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={focused ? 2.2 : 1.8} fill={focused ? `${color}18` : 'none'} />
    </Svg>
  );
}

function MapIcon({ color, size, focused }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6L8 3L16 7L21 4V18L16 21L8 17L3 20V6Z"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? `${color}18` : 'none'}
      />
      <Line x1="8" y1="3" x2="8" y2="17" stroke={color} strokeWidth={focused ? 2.2 : 1.8} />
      <Line x1="16" y1="7" x2="16" y2="21" stroke={color} strokeWidth={focused ? 2.2 : 1.8} />
    </Svg>
  );
}

function MessageIcon({ color, size, focused }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 16.1 20.1 17 19 17H7L3 21V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V15Z"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? `${color}18` : 'none'}
      />
    </Svg>
  );
}

function UserIcon({ color, size, focused }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? `${color}18` : 'none'}
      />
      <Path
        d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Tab bar icon wrapper
// ---------------------------------------------------------------------------

function TabIcon({ Icon, focused, color, size }: { Icon: React.FC<IconProps>; focused: boolean; color: string; size: number }) {
  return (
    <View
      style={[
        styles.tabIconWrap,
        focused && { backgroundColor: `${color}18` },
      ]}
    >
      <Icon color={color} size={size} focused={focused} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MainTabs
// ---------------------------------------------------------------------------

function MainTabs() {
  const insets = useSafeAreaInsets();
  const P = usePalette();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarStyle: {
          backgroundColor: P.surface,
          borderTopColor: P.border,
          borderTopWidth: 1,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 12),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: P.primary,
        tabBarInactiveTintColor: P.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon Icon={HomeIcon} focused={focused} color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Schemes"
        component={SchemesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon Icon={GridIcon} focused={focused} color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Roadmap"
        component={RoadmapScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon Icon={MapIcon} focused={focused} color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon Icon={MessageIcon} focused={focused} color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon Icon={UserIcon} focused={focused} color={color} size={size - 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// RootNavigator
// ---------------------------------------------------------------------------

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);

  if (!isAuthenticated) {
    if (showSignUp) {
      return <SignUpScreen onNavigateToLogin={() => setShowSignUp(false)} />;
    }
    return <LoginScreen onNavigateToSignUp={() => setShowSignUp(true)} />;
  }

  return <MainTabs />;
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
