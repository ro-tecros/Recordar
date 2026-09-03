import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppData } from '../store/AppDataProvider';
import * as haptics from '../lib/haptics';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { PressableScale } from '../components/PressableScale';
import type { RootStackParamList } from '../navigation';
import { colors, radius, shadow, spacing } from '../theme';
import {
  enterDown,
  enterFade,
  layoutSpring,
  springBouncy,
  springLayout,
} from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExitChecklist'>;
type Rt = RouteProp<RootStackParamList, 'ExitChecklist'>;

interface Section {
  key: string;
  title: string;
  icon: 'repeat' | 'navigate';
  entries: { id: string; title: string; note: string }[];
}

export function ExitChecklistScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { essentials, outings } = useAppData();
  const outingIds = route.params?.outingIds ?? [];

  const [checked, setChecked] = useState<Set<string>>(new Set());

  const sections = useMemo<Section[]>(() => {
    const result: Section[] = [];
    const enabledEssentials = essentials.filter((e) => e.enabled);
    if (enabledEssentials.length > 0) {
      result.push({
        key: 'essentials',
        title: 'Siempre',
        icon: 'repeat',
        entries: enabledEssentials.map((e) => ({
          id: e.id,
          title: e.title,
          note: e.note,
        })),
      });
    }
    for (const id of outingIds) {
      const outing = outings.find((o) => o.id === id);
      if (!outing || outing.items.length === 0) continue;
      result.push({
        key: outing.id,
        title: outing.title,
        icon: 'navigate',
        entries: outing.items.map((i) => ({
          id: i.id,
          title: i.title,
          note: i.note,
        })),
      });
    }
    return result;
  }, [essentials, outings, outingIds]);

  const allEntries = useMemo(
    () => sections.flatMap((s) => s.entries),
    [sections]
  );
  const total = allEntries.length;
  const doneCount = allEntries.filter((e) => checked.has(e.id)).length;
  const allChecked = total > 0 && doneCount === total;

  const toggle = (id: string) => {
    haptics.selection();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Barra de progreso animada.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(total > 0 ? doneCount / total : 0, springLayout);
  }, [doneCount, total, progress]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Celebración al completar todo.
  const celebrate = useSharedValue(0);
  useEffect(() => {
    if (allChecked) {
      haptics.success();
      celebrate.value = withSequence(
        withTiming(1, { duration: 220 }),
        withSpring(0, springBouncy)
      );
    }
  }, [allChecked, celebrate]);
  const footerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + celebrate.value * 0.05 }],
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 130 },
        ]}
      >
        <Animated.Text entering={enterDown(0, 300)} style={styles.heading}>
          Antes de salir
        </Animated.Text>

        {total > 0 ? (
          <Animated.View entering={enterFade(80)} style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, fillStyle]} />
            </View>
            <Text style={styles.progressText}>
              {doneCount} de {total} revisado
            </Text>
          </Animated.View>
        ) : null}

        {sections.length === 0 ? (
          <Animated.View entering={enterFade()} style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Nada que revisar</Text>
            <Text style={styles.emptyText}>
              Agrega cosas en “Siempre”, o entra a una salida y anota qué llevar.
            </Text>
          </Animated.View>
        ) : (
          sections.map((section, si) => (
            <Animated.View
              key={section.key}
              entering={enterDown(si, 280)}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={
                    section.icon === 'repeat'
                      ? 'repeat-outline'
                      : 'navigate-outline'
                  }
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.entries.map((entry) => {
                const isChecked = checked.has(entry.id);
                return (
                  <Animated.View key={entry.id} layout={layoutSpring}>
                    <PressableScale
                      onPress={() => toggle(entry.id)}
                      scaleTo={0.98}
                      style={[styles.item, isChecked && styles.itemChecked]}
                    >
                      <AnimatedCheck checked={isChecked} size={30} />
                      <View style={styles.itemBody}>
                        <Text
                          style={[
                            styles.itemTitle,
                            isChecked && styles.itemTitleChecked,
                          ]}
                        >
                          {entry.title}
                        </Text>
                        {entry.note ? (
                          <Text style={styles.itemNote} numberOfLines={2}>
                            {entry.note}
                          </Text>
                        ) : null}
                      </View>
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Animated.View
        style={[
          styles.footer,
          footerStyle,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <PressableScale
          onPress={() => navigation.popToTop()}
          style={[styles.doneBtn, allChecked && styles.doneBtnAll]}
        >
          <Text style={styles.doneText}>
            {total === 0
              ? 'Volver'
              : allChecked
              ? '¡Todo listo! Salir tranquilo'
              : 'Ya tengo todo'}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  heading: { fontSize: 24, fontWeight: '900', color: colors.text },
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  progressText: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow('sm'),
  },
  itemChecked: { backgroundColor: colors.successSoft, borderColor: '#BBE4CB' },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  itemTitleChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemNote: { fontSize: 13, color: colors.textMuted },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  doneBtnAll: { backgroundColor: colors.success },
  doneText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
