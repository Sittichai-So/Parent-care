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
import { addReminderResponseListener } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isRestoring, pendingRegistration } = useAuth();
  const { households, isLoadingHouseholds } = useFamilyContext();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = Colors[isDark ? 'dark' : 'light'];

  const isLoading = isRestoring || (isAuthenticated && isLoadingHouseholds);
  const hasHousehold = households.length > 0;

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
          <Stack.Screen name="medication-confirm" options={{ presentation: 'modal' }} />
          <Stack.Screen name="medication-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="appointment-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="vitals-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="appointment-detail" />
          <Stack.Screen name="appointments" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="medications" />
          <Stack.Screen
            name="emergency"
            options={{ presentation: 'modal', animation: 'fade_from_bottom' }}
          />
          <Stack.Screen name="family-member" />
          <Stack.Screen name="add-member" options={{ presentation: 'modal' }} />
          <Stack.Screen name="household-access" />
          <Stack.Screen name="audit-log" />
          <Stack.Screen name="messages" />
          <Stack.Screen name="notices" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated || pendingRegistration !== null}>
          <Stack.Screen name="household-setup" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
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
