import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppButton, type IconName } from './app-button';
import { Card } from './card';
import { RemoteIllustration } from './remote-illustration';

type PromoCardProps = {
  title: string;
  ctaLabel: string;
  onPress: () => void;
  icon: IconName;
};

export function PromoCard({ title, ctaLabel, onPress, icon }: PromoCardProps) {
  const theme = useTheme();

  return (
    <Card tone="primary" elevation="flat" padding={Spacing.three} gap={Spacing.three} style={styles.card}>
      <View style={[styles.illustrationWrap, { backgroundColor: theme.skySoft }]}>
        <RemoteIllustration
          uri="https://raw.githubusercontent.com/cuuupid/undraw-illustrations/master/svg/conversation_h12g.svg"
          width={64}
          height={64}
          fallbackIcon={icon}
        />
      </View>
      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        <AppButton
          label={ctaLabel}
          icon="arrow-forward"
          iconPosition="trailing"
          size="medium"
          onPress={onPress}
          style={styles.button}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center' },
  illustrationWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  body: { flex: 1, gap: Spacing.two },
  button: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: Spacing.three },
});
