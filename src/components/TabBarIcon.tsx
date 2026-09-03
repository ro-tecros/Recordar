import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springBouncy } from '../ui/motion';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}

/** Icono de pestaña que da un pequeño salto al activarse. */
export function TabBarIcon({ name, color, size, focused }: Props) {
  const p = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, springBouncy);
  }, [focused, p]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + p.value * 0.12 },
      { translateY: -p.value * 3 },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
