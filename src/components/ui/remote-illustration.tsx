import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { Ionicons } from '@expo/vector-icons';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-button';

type RemoteIllustrationProps = {
  /** Direct SVG URL — must be a raw file link (e.g. raw.githubusercontent.com), not an
   *  interactive viewer page. Illustrations are unDraw's open-source set (MIT licensed). */
  uri: string;
  width: number;
  height: number;
  /** Shown instead of the network image while it loads, or if the fetch fails —
   *  this screen must still look intentional with no internet connection. */
  fallbackIcon: IconName;
};

/** Flat-illustration art pulled from unDraw at runtime via `SvgUri`, with a themed
 *  icon fallback so a slow or failed fetch never leaves a blank hole in the layout. */
export function RemoteIllustration({ uri, width, height, fallbackIcon }: RemoteIllustrationProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View
        style={[
          styles.fallback,
          { width, height, backgroundColor: theme.skySoft, borderRadius: Radius.lg },
        ]}>
        <Ionicons name={fallbackIcon} size={Math.min(width, height) * 0.4} color={theme.primary} />
      </View>
    );
  }

  return <SvgUri uri={uri} width={width} height={height} onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  fallback: { justifyContent: 'center', alignItems: 'center' },
});
