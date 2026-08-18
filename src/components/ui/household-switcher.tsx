import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CaretDownIcon, CaretRightIcon, CheckCircleIcon, PlusCircleIcon, StarIcon, XIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { HouseholdKindMeta } from '@/constants/household';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import * as householdsApi from '@/services/households-api';

/** The navy header's household pill + switch sheet, per the reference
 *  design — real data only: `households`/`setCurrentHouseholdId`/`kind`/
 *  `isDefault`/`setDefaultHousehold` all come from `family-context.tsx`
 *  (an account can belong to several households, each with its own kind
 *  and its own "กลุ่มเริ่มต้น" flag on this account's membership). */
export function HouseholdSwitcher() {
  const theme = useTheme();
  const router = useRouter();
  const { households, currentHousehold, currentHouseholdId, setCurrentHouseholdId, setDefaultHousehold } =
    useFamilyContext();
  const [open, setOpen] = useState(false);
  // Member counts for the "<label> · <n> คน" meta line — not part of
  // `/households/mine` (that only returns household+membership), so fetched
  // lazily per household the first time the sheet opens, rather than eagerly
  // for every household on every login.
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const missing = households.filter((household) => memberCounts[household.id] === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map(async (household) => {
        try {
          const members = await householdsApi.getMembers(household.id);
          return [household.id, members.length] as const;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setMemberCounts((current) => {
        const next = { ...current };
        for (const entry of results) {
          if (entry) next[entry[0]] = entry[1];
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, households, memberCounts]);

  const handleSetDefault = async (householdId: string) => {
    setSettingDefaultId(householdId);
    try {
      await setDefaultHousehold(householdId);
    } catch {
      // Non-critical preference — silently ignored, matches the sheet's
      // otherwise-optimistic switch/close interactions elsewhere here.
    } finally {
      setSettingDefaultId(null);
    }
  };

  if (households.length === 0) return null;

  const PillIcon = HouseholdKindMeta[currentHousehold?.kind ?? 'other'].icon;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="สลับกลุ่มบ้าน"
        accessibilityHint={currentHousehold ? `กำลังดู ${currentHousehold.name} แตะเพื่อสลับ` : undefined}
        style={({ pressed }) => [styles.pill, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
        <PillIcon weight="duotone" size={16} color={theme.heroText} />
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
              const kindMeta = HouseholdKindMeta[household.kind];
              const KindIcon = kindMeta.icon;
              const count = memberCounts[household.id];
              const meta = `${kindMeta.label}${count !== undefined ? ` · ${count} คน` : ''}`;
              const isSettingThis = settingDefaultId === household.id;
              return (
                <View
                  key={household.id}
                  style={[
                    styles.row,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      borderWidth: active ? 2 : StyleSheet.hairlineWidth * 2,
                    },
                  ]}>
                  <Pressable
                    onPress={() => {
                      setCurrentHouseholdId(household.id);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`สลับไปกลุ่ม ${household.name}`}
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
                    <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
                      <KindIcon weight="fill" size={20} color={theme.primaryText} />
                    </View>
                    <View style={styles.rowBody}>
                      <ThemedText type="smallBold">{household.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textMuted">
                        {meta}
                      </ThemedText>
                    </View>
                    {active ? (
                      <CheckCircleIcon weight="fill" size={20} color={theme.primary} />
                    ) : (
                      <CaretRightIcon weight="bold" size={18} color={theme.textMuted} />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleSetDefault(household.id)}
                    disabled={household.isDefault || isSettingThis}
                    accessibilityRole="button"
                    accessibilityLabel={`ตั้ง ${household.name} เป็นกลุ่มเริ่มต้น`}
                    accessibilityState={{ disabled: household.isDefault, busy: isSettingThis }}
                    style={({ pressed }) => [
                      styles.defaultRow,
                      { backgroundColor: household.isDefault ? theme.primarySoft : theme.surfaceSunken },
                      pressed && !household.isDefault && styles.pressed,
                    ]}>
                    <StarIcon
                      weight={household.isDefault ? 'fill' : 'duotone'}
                      size={16}
                      color={household.isDefault ? theme.primaryText : theme.textMuted}
                    />
                    <ThemedText
                      type="caption"
                      style={{ color: household.isDefault ? theme.primaryText : theme.textMuted, fontWeight: '700' }}>
                      {isSettingThis ? 'กำลังตั้งค่า...' : household.isDefault ? 'กลุ่มเริ่มต้น' : 'ตั้งเป็นกลุ่มเริ่มต้น'}
                    </ThemedText>
                  </Pressable>
                </View>
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
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two + 2,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowIcon: { width: 42, height: 42, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: 1 },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 40,
    borderRadius: Radius.md,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 50,
    borderRadius: Radius.md,
  },
});
