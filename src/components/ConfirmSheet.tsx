import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from './PressableScale';
import { colors, radius, shadow, spacing } from '../theme';

// Las animaciones declarativas de Reanimated son inestables en web.
const anim = Platform.OS !== 'web';
const backdropIn = anim ? FadeIn.duration(160) : undefined;
const backdropOut = anim ? FadeOut.duration(160) : undefined;
const sheetIn = anim
  ? SlideInDown.springify().damping(20).stiffness(220)
  : undefined;
const sheetOut = anim ? SlideOutDown.duration(180) : undefined;

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {opts ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            entering={backdropIn}
            exiting={backdropOut}
            style={styles.backdrop}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} />
          </Animated.View>

          <Animated.View
            entering={sheetIn}
            exiting={sheetOut}
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.grabber} />
            <Text style={styles.title}>{opts.title}</Text>
            {opts.message ? (
              <Text style={styles.message}>{opts.message}</Text>
            ) : null}

            <PressableScale
              onPress={() => close(true)}
              style={[
                styles.confirmBtn,
                opts.destructive && styles.confirmDestructive,
              ]}
            >
              <Text style={styles.confirmText}>
                {opts.confirmText ?? 'Aceptar'}
              </Text>
            </PressableScale>

            <PressableScale onPress={() => close(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{opts.cancelText ?? 'Cancelar'}</Text>
            </PressableScale>
          </Animated.View>
        </View>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    ...shadow('lg'),
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  confirmDestructive: { backgroundColor: colors.danger },
  confirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  cancelBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
});
