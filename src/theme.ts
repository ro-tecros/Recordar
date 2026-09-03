import { Platform } from 'react-native';

export const colors = {
  bg: '#F4F6F9',
  bgElevated: '#FBFCFE',
  card: '#FFFFFF',
  text: '#18202F',
  textMuted: '#69748A',
  border: '#E4E9F1',
  borderStrong: '#D3DBE6',
  primary: '#2563EB',
  primarySoft: '#EEF3FE',
  primaryText: '#FFFFFF',
  chipBg: '#EEF2F8',
  chipActiveBg: '#2563EB',
  chipActiveText: '#FFFFFF',
  exit: '#0F9D58',
  exitDark: '#0B7C45',
  exitSoft: '#E7F6EE',
  track: '#E9EDF3',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  success: '#16A34A',
  successSoft: '#EAF7EF',
  warning: '#D97706',
  overlay: 'rgba(17, 24, 39, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

type Shadow = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

/** Sombra suave y coherente, ajustada por plataforma. */
export function shadow(level: 'sm' | 'md' | 'lg' = 'md', color = '#101828'): Shadow {
  const map = {
    sm: { o: 0.06, r: 6, y: 2, e: 2 },
    md: { o: 0.1, r: 16, y: 6, e: 5 },
    lg: { o: 0.16, r: 28, y: 12, e: 10 },
  } as const;
  const s = map[level];
  return {
    shadowColor: color,
    shadowOpacity: Platform.OS === 'android' ? s.o * 1.4 : s.o,
    shadowRadius: s.r,
    shadowOffset: { width: 0, height: s.y },
    elevation: s.e,
  };
}
