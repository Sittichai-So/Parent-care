import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Wrap the content in a ScrollView. Turn off for screens that must not scroll. */
  scroll?: boolean;
  /** Vertically centre short content (confirmation / decision screens). */
  center?: boolean;
  /** Lift content above the keyboard — use on any screen with a TextInput. */
  keyboardAvoiding?: boolean;
  /** Vertical rhythm between direct children. */
  gap?: number;
  /** Pinned to the bottom of the screen, outside the scroll area. */
  footer?: ReactNode;
  edges?: readonly Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * The single layout shell for every screen: themed background, safe-area insets,
 * a readable max width on tablets/web, and consistent gutters.
 */
export function Screen({
  children,
  scroll = true,
  center = false,
  keyboardAvoiding = false,
  gap = Spacing.three,
  footer,
  edges = ['top', 'left', 'right'],
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        { gap },
        center && styles.centered,
        contentContainerStyle,
      ]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, { gap }, center && styles.centered, contentContainerStyle]}>
      {children}
    </View>
  );

  const body = (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={styles.contentWidth}>
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  contentWidth: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  staticContent: {
    flex: 1,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  centered: { justifyContent: 'center' },
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.two,
    gap: Spacing.two,
  },
});
