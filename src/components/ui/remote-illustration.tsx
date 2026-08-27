import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { Ionicons } from '@expo/vector-icons';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-button';

type RemoteIllustrationProps = {
  uri: string;
  width: number;
  height: number;
  fallbackIcon: IconName;
};

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
