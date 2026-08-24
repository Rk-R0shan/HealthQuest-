/**
 * HealthQuest — Root Layout
 *
 * Responsibilities:
 * 1. Load Nunito fonts
 * 2. Control splash screen visibility
 * 3. Initialize Firebase
 * 4. Provide TanStack Query client
 * 5. Route to auth/onboarding/main based on authentication state
 */
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/config/queryClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { colors } from '@/theme';

import '../src/theme/global.css';

// Prevent splash screen from hiding until we're ready
SplashScreen.preventAutoHideAsync();

import { NotificationProvider } from '@/shared/components/ui/NotificationContext';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const { user, profile, isLoading: authLoading, profileLoading, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Nunito_400Regular: require('../assets/fonts/Nunito-Regular.ttf'),
          Nunito_500Medium: require('../assets/fonts/Nunito-Medium.ttf'),
          Nunito_600SemiBold: require('../assets/fonts/Nunito-SemiBold.ttf'),
          Nunito_700Bold: require('../assets/fonts/Nunito-Bold.ttf'),
          Nunito_800ExtraBold: require('../assets/fonts/Nunito-ExtraBold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load fonts:', error);
        // Continue without custom fonts — fallback to system font
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Mark app as ready when fonts + auth + profile are loaded
  useEffect(() => {
    const waitingForProfile = user && profileLoading && !profile;
    if (fontsLoaded && !authLoading && !waitingForProfile) {
      setAppReady(true);
    }
  }, [fontsLoaded, authLoading, user, profileLoading, profile]);

  // Hide splash screen when app is ready
  const onLayoutReady = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Auth-based routing
  useEffect(() => {
    if (!appReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      // Not logged in → go to login screen
      if (!inAuthGroup || segments[1] === 'verify-email') {
        router.replace('/(auth)/login');
      }
      return;
    }

    // User is logged in, check email verification
    if (!user.emailVerified) {
      if (segments[1] !== 'verify-email') {
        router.replace('/(auth)/verify-email');
      }
      return;
    }

    // User is logged in & verified, check onboarding
    const isOnboarded = profile?.isOnboarded || false;

    if (!isOnboarded) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/avatar');
      }
    } else {
      // Logged in, verified, and onboarded -> go to main tabs if in auth or onboarding
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, profile, segments, appReady, router]);

  // Show loading while fonts/auth initialize
  if (!appReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onLayout={onLayoutReady}
      >
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <StatusBar style="dark" backgroundColor={colors.background} />
          <Slot />
        </NotificationProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
