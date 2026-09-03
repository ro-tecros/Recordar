import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAppData } from '../store/AppDataProvider';
import * as haptics from '../lib/haptics';
import type { RootStackParamList } from '../navigation';
import { InlineAdd } from '../components/InlineAdd';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { PressableScale } from '../components/PressableScale';
import { useConfirm } from '../components/ConfirmSheet';
import { colors, radius, shadow, spacing } from '../theme';
import { enterDown, enterFade, exitUp, layoutSpring } from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function EssentialsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();
  const { essentials, addEssential, toggleEssential, removeEssential } =
    useAppData();

  const askRemove = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Quitar de siempre',
      message: `“${title}” dejará de aparecer al salir.`,
      confirmText: 'Quitar',
      destructive: true,
    });
    if (ok) removeEssential(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enterDown(0, 300)} style={styles.header}>
          <Text style={styles.intro}>
            Estas cosas aparecen cada vez que tocas el botón{' '}
            <Text style={styles.bold}>SALIR</Text>. Toca el círculo para activarlas
            o desactivarlas.
          </Text>
          <InlineAdd
            placeholder="Ej. Llaves, billetera, celular…"
            onAdd={(text) => addEssential(text)}
          />
        </Animated.View>

        <View style={styles.list}>
          {essentials.map((item, i) => (
            <Animated.View
              key={item.id}
              entering={enterDown(i)}
              exiting={exitUp()}
              layout={layoutSpring}
            >
              <PressableScale
                onPress={() =>
                  navigation.navigate('ItemForm', {
                    mode: 'essential',
                    id: item.id,
                  })
                }
                scaleTo={0.98}
                style={styles.row}
              >
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    toggleEssential(item.id);
                  }}
                  hitSlop={12}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.enabled }}
                >
                  <AnimatedCheck checked={item.enabled} size={26} />
                </Pressable>
                <View style={styles.rowBody}>
                  <Text
                    style={[styles.rowTitle, !item.enabled && styles.rowTitleOff]}
                  >
                    {item.title}
                  </Text>
                  {item.note ? (
                    <Text style={styles.rowNote} numberOfLines={1}>
                      {item.note}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => askRemove(item.id, item.title)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${item.title}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </PressableScale>
            </Animated.View>
          ))}

          {essentials.length === 0 ? (
            <Animated.View entering={enterFade(120)} style={styles.empty}>
              <Ionicons name="key-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                Agrega lo que llevas siempre: llaves, billetera, celular, tarjeta
                del transporte…
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  bold: { fontWeight: '900', color: colors.text },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow('sm'),
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowTitleOff: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  rowNote: { fontSize: 12, color: colors.textMuted },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
