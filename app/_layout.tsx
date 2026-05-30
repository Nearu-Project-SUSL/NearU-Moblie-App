import React, { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';

function RootNavigationLayout() {
  const { isAuthenticated, isSessionLoading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  // Route protection gate handler
  useEffect(() => {
    if (isSessionLoading) return;
    if (segments.length === 0) return; // Guard against uninitialized transient router states

    const inAuthGroup = segments.includes('(auth)');

    if (!isAuthenticated && !inAuthGroup) {
      // Direct unauthorized users strictly to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect logged-in users directly to Browse tab dashboard
      router.replace('/(tabs)/browse');
    }
  }, [isAuthenticated, isSessionLoading, segments]);

  if (isSessionLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar style={systemTheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigationLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
