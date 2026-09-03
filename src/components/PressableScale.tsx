import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springSoft } from '../ui/motion';

interface Props extends Omit<PressableProps, 'style'> {
  /** Escala al presionar (por defecto 0.96). */
  scaleTo?: number;
  /** Opacidad al presionar (por defecto 1: solo escala). */
  dimTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Pressable con feedback de resorte: se hunde suavemente al tocar y vuelve
 * con un pequeño rebote. Es la base táctil de toda la app.
 */
export function PressableScale({
  scaleTo = 0.96,
  dimTo = 1,
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - progress.value * (1 - scaleTo) }],
    opacity: 1 - progress.value * (1 - dimTo),
  }));

  const handleIn = (e: GestureResponderEvent) => {
    progress.value = withSpring(1, springSoft);
    onPressIn?.(e);
  };
  const handleOut = (e: GestureResponderEvent) => {
    progress.value = withSpring(0, springSoft);
    onPressOut?.(e);
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
    >
      <Animated.View style={[style, animatedStyle]}>
        {typeof children === 'function' ? null : (children as React.ReactNode)}
      </Animated.View>
    </Pressable>
  );
}

/** Variante sin Pressable, solo el contenedor animado (para uso interno). */
export const AnimatedCard = Animated.createAnimatedComponent(View);
