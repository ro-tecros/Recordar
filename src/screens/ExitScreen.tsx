import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
import { enterDown, enterFade, layoutSpring, springBouncy } from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ExitScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { essentials, outings } = useAppData();

  const [selected, setSelected] = useState<string[]>([]);

  const enabledEssentials = useMemo(
    () => essentials.filter((e) => e.enabled),
    [essentials]
  );
  const pendingOutings = useMemo(() => outings.filter((o) => !o.done), [outings]);

  const validSelected = selected.filter((id) =>
    pendingOutings.some((o) => o.id === id)
  );

  const totalCount = useMemo(() => {
    const outingItems = pendingOutings
      .filter((o) => validSelected.includes(o.id))
      .reduce((sum, o) => sum + o.items.length, 0);
    return enabledEssentials.length + outingItems;
  }, [enabledEssentials, pendingOutings, validSelected]);

  const toggle = (id: string) => {
    haptics.selection();
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExit = () => {
    haptics.success();
    navigation.navigate('ExitChecklist', { outingIds: validSelected });
  };

  // Pulso "sonar" detrás del botón. Solo en nativo: en web un rAF infinito
  // gasta batería sin aportar mucho.
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  // Rebote del contador cuando cambia.
  const count = useSharedValue(1);
  useEffect(() => {
    count.value = withSequence(
      withTiming(1.12, { duration: 120 }),
      withSpring(1, springBouncy)
    );
  }, [totalCount, count]);
  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: count.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text entering={enterDown(0, 320)} style={styles.title}>
          ¿Vas a salir?
        </Animated.Text>
        <Animated.Text entering={enterDown(1, 320)} style={styles.subtitle}>
          Marca la salida que vas a hacer y toca el botón. Te muestro todo junto
          con lo que llevas siempre.
        </Animated.Text>

        {pendingOutings.length > 0 ? (
          <>
            <Animated.Text entering={enterFade(120)} style={styles.label}>
              ¿Qué vas a hacer?
            </Animated.Text>
            <View style={styles.outingList}>
              {pendingOutings.map((o, i) => {
                const active = validSelected.includes(o.id);
                return (
                  <Animated.View
                    key={o.id}
                    entering={enterDown(i)}
                    layout={layoutSpring}
                  >
                    <PressableScale
                      onPress={() => toggle(o.id)}
                      style={[
                        styles.outingCard,
                        active && styles.outingCardActive,
                      ]}
                    >
                      <AnimatedCheck
                        checked={active}
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.flex}>
                        <Text style={styles.outingTitle} numberOfLines={1}>
                          {o.title}
                        </Text>
                        <Text style={styles.outingMeta}>
                          {o.items.length === 0
                            ? 'Sin cosas anotadas'
                            : o.items.length === 1
                            ? '1 cosa'
                            : `${o.items.length} cosas`}
                        </Text>
                      </View>
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.bigWrap}>
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, haloStyle]}
          />
          <PressableScale
            onPress={handleExit}
            scaleTo={0.97}
            style={styles.bigButton}
            accessibilityRole="button"
            accessibilityLabel={`Salir. ${totalCount} cosas para revisar.`}
          >
            <Ionicons name="walk" size={54} color="#FFFFFF" />
            <Text style={styles.bigButtonText}>SALIR</Text>
            <Animated.Text style={[styles.bigButtonHint, countStyle]}>
              {totalCount === 0
                ? 'Nada que revisar todavía'
                : totalCount === 1
                ? '1 cosa para revisar'
                : `${totalCount} cosas para revisar`}
            </Animated.Text>
          </PressableScale>
        </View>

        {enabledEssentials.length > 0 ? (
          <Animated.Text
            entering={enterFade()}
            style={styles.always}
            numberOfLines={1}
          >
            Siempre: {enabledEssentials.map((e) => e.title).join(' · ')}
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  outingList: { gap: spacing.sm },
  outingCard: {
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
  outingCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  outingTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  outingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bottom: { gap: spacing.md },
  bigWrap: { alignItems: 'stretch', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.xl,
    backgroundColor: colors.exit,
  },
  bigButton: {
    backgroundColor: colors.exit,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadow('lg', colors.exitDark),
  },
  bigButtonText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 3,
  },
  bigButtonHint: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '700',
  },
  always: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
