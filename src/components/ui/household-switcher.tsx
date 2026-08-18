import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  HouseIcon,
  PlusCircleIcon,
  XIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

/** The navy header's household pill + switch sheet, per the reference
 *  design — real data only: `households`/`setCurrentHouseholdId` already
 *  exist in `family-context.tsx` (an account can belong to several), this
 *  just gives them a UI. Unlike the mock, there's no separate "default
 *  household" flag to set — the server has none, and the context already
 *  keeps the last-picked household selected for the rest of the session. */
export function HouseholdSwitcher() {
  const theme = useTheme();
  const router = useRouter();
  const { households, currentHousehold, currentHouseholdId, setCurrentHouseholdId } = useFamilyContext();
  const [open, setOpen] = useState(false);

  if (households.length === 0) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="สลับกลุ่มบ้าน"
        accessibilityHint={currentHousehold ? `กำลังดู ${currentHousehold.name} แตะเพื่อสลับ` : undefined}
        style={({ pressed }) => [styles.pill, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
        <HouseIcon weight="duotone" size={16} color={theme.heroText} />
        <ThemedText numberOfLines={1} style={[styles.pillLabel, { color: theme.heroText }]}>
          {currentHousehold?.name ?? 'เลือกกลุ่มบ้าน'}
        </ThemedText>
        <CaretDownIcon weight="bold" size={12} color={theme.heroText} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="ปิด"
        />
        <View style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.sheetHead}>
            <ThemedText type="heading">กลุ่มบ้านของฉัน</ThemedText>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="ปิด"
              style={({ pressed }) => [styles.close, { backgroundColor: theme.surfaceSunken }, pressed && styles.pressed]}>
              <XIcon weight="bold" size={20} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {households.map((household) => {
              const active = household.id === currentHouseholdId;
              return (
                <Pressable
                  key={household.id}
                  onPress={() => {
                    setCurrentHouseholdId(household.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`สลับไปกลุ่ม ${household.name}`}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <View
                    style={[
                      styles.row,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        borderWidth: active ? 2 : StyleSheet.hairlineWidth * 2,
                      },
                    ]}>
                    <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
                      <HouseIcon weight="fill" size={20} color={theme.primaryText} />
                    </View>
                    <View style={styles.rowBody}>
                      <ThemedText type="smallBold">{household.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textMuted">
                        {household.role}
                      </ThemedText>
                    </View>
                    {active ? (
                      <CheckCircleIcon weight="fill" size={20} color={theme.primary} />
                    ) : (
                      <CaretRightIcon weight="bold" size={18} color={theme.textMuted} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              setOpen(false);
              router.push('/household-setup');
            }}
            accessibilityRole="button"
            accessibilityLabel="เพิ่มหรือเข้าร่วมกลุ่มบ้านอื่น"
            style={({ pressed }) => pressed && styles.pressed}>
            <View style={[styles.addRow, { backgroundColor: theme.primarySoft }]}>
              <PlusCircleIcon weight="duotone" size={20} color={theme.primaryText} />
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                เพิ่มหรือเข้าร่วมกลุ่มบ้านอื่น
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    maxWidth: '100%',
  },
  pillLabel: { fontSize: 12.5, fontWeight: '700', flexShrink: 1 },
  pressed: { opacity: 0.85 },

  scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.36)' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },

  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  rowIcon: { width: 42, height: 42, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: 1 },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 50,
    borderRadius: Radius.md,
  },
});
