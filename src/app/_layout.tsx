import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { FamilyProvider, useFamilyContext } from '@/context/family-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
// Deliberately not `import * as Notifications from 'expo-notifications'` here —
// see the header comment in services/notifications.ts for why that crashes on
// Expo Go/Android. addReminderResponseListener wraps it safely.
import { addReminderResponseListener } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isRestoring } = useAuth();
  const { households, isLoadingHouseholds } = useFamilyContext();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = Colors[isDark ? 'dark' : 'light'];

  // isLoadingHouseholds only matters once we know there's a session to load
  // households for — an unauthenticated user shouldn't wait on it.
  const isLoading = isRestoring || (isAuthenticated && isLoadingHouseholds);
  const hasHousehold = households.length > 0;

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

  // Tapping a medication/appointment reminder opens the relevant screen directly,
  // instead of just bringing the app to the foreground on its last screen.
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = addReminderResponseListener((data) => {
      if (data.kind === 'medication') {
        router.push({ pathname: '/medication-confirm', params: { id: data.medicationId } });
      } else {
        router.push({ pathname: '/appointment-detail', params: { id: data.appointmentId } });
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, router]);

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
        <Stack.Protected guard={isAuthenticated && hasHousehold}>
          <Stack.Screen name="(tabs)" />
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
          <Stack.Screen name="add-member" options={{ presentation: 'modal' }} />
        </Stack.Protected>

        {/* household-setup also covers "ผูกบัญชี" (claim), which an account
            that already has a household may still need — e.g. linking to a
            managed profile a relative pre-added in a *different* household.
            So it's reachable regardless of hasHousehold, not nested in the
            !hasHousehold-only block below. */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="household-setup" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          {/* First declared screen in this group is expo-router's initial
           *  route whenever the app lands here unauthenticated — "welcome"
           *  itself decides (via AsyncStorage) whether to actually show the
           *  splash or bounce straight to "login", so every subsequent visit
           *  (e.g. after logout) skips it in a single frame. */}
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="register" />
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
