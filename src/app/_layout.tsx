import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { FamilyProvider } from '@/context/family-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = Colors[isDark ? 'dark' : 'light'];

  /**
   * Navigation paints the area behind every screen. Deriving its theme from the
   * app palette avoids a white flash between screens in dark mode.
   */
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.background,
        card: palette.backgroundElement,
        text: palette.text,
        border: palette.border,
        primary: palette.primary,
      },
    };
  }, [isDark, palette]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, justifyContent: 'center' }}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          {/* Legacy aliases of the tab routes — guarded so signed-out users can't reach them. */}
          <Stack.Screen name="index" />
          <Stack.Screen name="explore" />
          {/* Task flows open as sheets — they are decisions, not destinations. */}
          <Stack.Screen name="medication-confirm" options={{ presentation: 'modal' }} />
          <Stack.Screen name="medication-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="appointment-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="vitals-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="appointment-detail" />
          <Stack.Screen name="appointments" />
          <Stack.Screen name="medications" />
          <Stack.Screen
            name="emergency"
            options={{ presentation: 'modal', animation: 'fade_from_bottom' }}
          />
          <Stack.Screen name="family-member" />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <AnimatedSplashOverlay />
        <RootLayoutNav />
      </FamilyProvider>
    </AuthProvider>
  );
}
