// ROKDA ROOT APP LAYOUT & PROVIDERS STACK

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { DbProvider } from '../src/context/DbContext';
import LockScreen from './lock';

function NavigationWrapper() {
  const { user, isLoading, isLocked } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to Auth Welcome
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      // Redirect to Home Dashboard
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user && isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transaction/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="transaction/split" options={{ presentation: 'modal' }} />
        <Stack.Screen name="accounts/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="goals/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="subscriptions/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="recurring/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="calendar/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="reports/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="monthly-review/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="financial-health/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/security" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/backup" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/account" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/customization" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DbProvider>
          <NavigationWrapper />
        </DbProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
