/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  const { isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';

  return Colors[theme];
}
