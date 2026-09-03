import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAppData } from '../store/AppDataProvider';
import * as haptics from '../lib/haptics';
import type { Outing } from '../db/types';
import type { RootStackParamList } from '../navigation';
import { InlineAdd } from '../components/InlineAdd';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { PressableScale } from '../components/PressableScale';
import { colors, radius, shadow, spacing } from '../theme';
import { enterDown, enterFade, exitUp, layoutSpring } from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OutingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { outings, addOuting, toggleOutingDone } = useAppData();

  const pending = useMemo(() => outings.filter((o) => !o.done), [outings]);
  const done = useMemo(() => outings.filter((o) => o.done), [outings]);

  const renderOuting = (outing: Outing, i: number) => (
    <Animated.View
      key={outing.id}
      entering={enterDown(i)}
      exiting={exitUp()}
      layout={layoutSpring}
    >
      <PressableScale
        onPress={() => navigation.navigate('OutingDetail', { id: outing.id })}
        scaleTo={0.98}
        style={styles.row}
      >
        <Pressable
          onPress={() => {
            haptics.selection();
            toggleOutingDone(outing.id);
          }}
          hitSlop={12}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: outing.done }}
        >
          <AnimatedCheck checked={outing.done} size={26} />
        </Pressable>
        <View style={styles.rowBody}>
          <Text
            style={[styles.rowTitle, outing.done && styles.rowTitleDone]}
            numberOfLines={1}
          >
            {outing.title}
          </Text>
          <Text style={styles.rowNote}>
            {outing.items.length === 0
              ? 'Sin cosas anotadas'
              : outing.items.length === 1
              ? '1 cosa'
              : `${outing.items.length} cosas`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableScale>
    </Animated.View>
  );

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
            Crea una salida (ej. “Ir al mecánico”) y adentro anota qué no olvidar
            para esa vez: documentos, carnet de conducir, dinero…
          </Text>
          <InlineAdd
            placeholder="Ej. Ir al mecánico"
            onAdd={async (text) => {
              const id = await addOuting(text);
              navigation.navigate('OutingDetail', { id });
            }}
          />
        </Animated.View>

        {pending.length > 0 ? (
          <Animated.Text entering={enterFade()} style={styles.sectionHeader}>
            Pendientes
          </Animated.Text>
        ) : null}
        <View style={styles.list}>{pending.map(renderOuting)}</View>

        {done.length > 0 ? (
          <Animated.Text
            entering={enterFade()}
            style={[styles.sectionHeader, styles.sectionHeaderSpaced]}
          >
            Completadas
          </Animated.Text>
        ) : null}
        <View style={styles.list}>{done.map(renderOuting)}</View>

        {outings.length === 0 ? (
          <Animated.View entering={enterFade(120)} style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Aún no tienes salidas. Crea la primera arriba.
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionHeaderSpaced: { marginTop: spacing.lg },
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
  rowTitleDone: {
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
