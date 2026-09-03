import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Envoltorio seguro de expo-haptics. En web (PWA) no hay API háptica, así que
 * estas funciones no hacen nada en vez de lanzar un error.
 */

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export function selection(): void {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => undefined);
}

export function success(): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => undefined
  );
}

export function impact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): void {
  if (!enabled) return;
  Haptics.impactAsync(style).catch(() => undefined);
}
