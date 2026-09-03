import { Platform } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';

/** Resorte suave para presión de botones y tarjetas. */
export const springSoft = { damping: 20, stiffness: 240, mass: 0.7 } as const;

/** Resorte con un poco de rebote, para checks y celebraciones. */
export const springBouncy = { damping: 12, stiffness: 260, mass: 0.8 } as const;

/** Resorte para transiciones de layout de listas. */
export const springLayout = { damping: 22, stiffness: 200, mass: 0.9 } as const;

export const timingFast = {
  duration: 160,
  easing: Easing.out(Easing.cubic),
} as const;

export const timingMed = {
  duration: 260,
  easing: Easing.out(Easing.cubic),
} as const;

export const timingSlow = {
  duration: 420,
  easing: Easing.inOut(Easing.cubic),
} as const;

/** Retraso escalonado para animar listas de entrada. */
export function stagger(index: number, step = 45, max = 6): number {
  return Math.min(index, max) * step;
}

/**
 * En web las animaciones declarativas (entering/exiting/layout) de Reanimated
 * son inestables: los elementos pueden quedarse a media opacidad. Ahí las
 * desactivamos y el contenido simplemente aparece. Las animaciones basadas en
 * useAnimatedStyle (presión, barras de progreso, checks) sí funcionan en web.
 */
const declarativeOK = Platform.OS !== 'web';

export const enterDown = (index = 0, duration = 260) =>
  declarativeOK ? FadeInDown.duration(duration).delay(stagger(index)) : undefined;

export const enterFade = (delay = 0) =>
  declarativeOK ? FadeIn.delay(delay) : undefined;

export const exitUp = (duration = 150) =>
  declarativeOK ? FadeOutUp.duration(duration) : undefined;

export const layoutSpring = declarativeOK
  ? LinearTransition.springify()
  : undefined;
