import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { springBouncy, timingFast } from '../ui/motion';

interface Props {
  checked: boolean;
  size?: number;
  color?: string;
}

/**
 * Círculo de selección animado: el check entra con un pequeño rebote y
 * el aro vacío se desvanece. Se usa en todas las listas marcables.
 */
export function AnimatedCheck({ checked, size = 28, color = colors.success }: Props) {
  const p = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked) {
      p.value = withSequence(
        withTiming(1.15, timingFast),
        withSpring(1, springBouncy)
      );
    } else {
      p.value = withTiming(0, timingFast);
    }
  }, [checked, p]);

  const onStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: [{ scale: 0.4 + Math.min(1, p.value) * 0.6 }],
  }));
  const offStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, p.value),
  }));

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute' }, offStyle]}>
        <Ionicons name="ellipse-outline" size={size} color={colors.borderStrong} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, onStyle]}>
        <Ionicons name="checkmark-circle" size={size} color={color} />
      </Animated.View>
    </Animated.View>
  );
}
