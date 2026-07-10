import './src/global.css';

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from '@/navigation/RootNavigator';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { useThemeStore } from '@/store/themeStore';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const { loadPersistedTheme, colorScheme } = useThemeStore();

  useEffect(() => {
    loadPersistedTheme();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
          {!splashDone && (
            <SplashScreen onFinish={() => setSplashDone(true)} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
