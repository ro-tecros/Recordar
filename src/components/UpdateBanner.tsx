import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

type Status = 'idle' | 'downloading' | 'ready';

/**
 * Revisa si hay una actualización de código publicada con EAS Update.
 * Si la hay, la descarga en segundo plano y muestra un aviso para reiniciar.
 * En Expo Go y en modo desarrollo no hace nada (Updates.isEnabled === false).
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('idle');

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      setStatus('downloading');
      await Updates.fetchUpdateAsync();
      setStatus('ready');
    } catch (e) {
      console.log('[UpdateBanner] no se pudo comprobar la actualización', e);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  if (status === 'idle') return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.banner}>
        <Text style={styles.text}>
          {status === 'downloading'
            ? 'Descargando nueva versión…'
            : 'Nueva versión lista'}
        </Text>
        {status === 'ready' ? (
          <Pressable
            onPress={() => Updates.reloadAsync()}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          >
            <Text style={styles.btnText}>Actualizar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    flexShrink: 1,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
