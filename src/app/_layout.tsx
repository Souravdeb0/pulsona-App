import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { Colors } from '@/constants/theme';
import { SafeStorage } from '@/services/storage';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

function RootLayoutNav() {
  const { token, isLoading, hasOnboarded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];



  useEffect(() => {
    if (isLoading || hasOnboarded === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboarding = (segments[0] as string) === 'onboarding';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // After login, check if they need onboarding
      if (!hasOnboarded) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/');
      }
    } else if (token && !hasOnboarded && !onOnboarding) {
      router.replace('/onboarding' as any);
    }
  }, [token, isLoading, segments, hasOnboarded]);

  if (isLoading || hasOnboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.backgroundElement,
      text: colors.text,
      border: colors.glassBorder,
      primary: colors.primary,
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.backgroundElement,
      text: colors.text,
      border: colors.glassBorder,
      primary: colors.primary,
    },
  };

  return (
    // We intentionally bypass mapping React Navigation's ThemeProvider scheme
    // and instead provide custom colors directly below. We use the custom theme hook.
    <NavThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-device" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="instructions" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="results" />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <DeviceProvider>
          <RootLayoutNav />
        </DeviceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
