import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppButton } from '@/components/ui/app-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY = 'parent-care.has-seen-onboarding';

/** First-run welcome screen. Shown once per device install (tracked in
 *  AsyncStorage), then every later unauthenticated visit skips straight past
 *  it to the login screen. */
export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'true') {
          router.replace('/login');
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));
  }, [router]);

  const handleContinue = () => {
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    router.replace('/login');
  };

  // Blank themed frame while the AsyncStorage check resolves — deliberately
  // not a spinner, since on a repeat visit this resolves in a single frame
  // and a spinner would just flash.
  if (!ready) {
    return <View style={[styles.blank, { backgroundColor: theme.background }]} />;
  }

  return (
    // `background.png` is a complete poster — logo, tagline, feature icons and
    // a hero photo all already composed into one image — so this screen is
    // just that image full-bleed plus the one button it doesn't already have,
    // not a re-render of copy the picture already says.
    <View style={styles.container}>
      <Image source={require('@/assets/images/background.png')} style={styles.background} contentFit="cover" />

      {/* Fades the image to the page background right where the CTA sits, so
       *  the button stays legible over whatever happens to be in the photo
       *  there rather than needing a hard-edged card. */}
      <View style={[styles.scrim, { experimental_backgroundImage: `linear-gradient(to bottom, transparent, ${theme.background})` }]} />

      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.body}>
          <AppButton
            label="เริ่มต้นใช้งาน"
            icon="arrow-forward"
            iconPosition="trailing"
            size="xlarge"
            onPress={handleContinue}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1 },
  container: { flex: 1 },
  background: StyleSheet.absoluteFill,
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '32%' },
  safeArea: { flex: 1, justifyContent: 'flex-end' },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
