import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors, Radius } from '@/constants/theme';

interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'normal' | 'abnormal' | 'warning' | 'info';
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const config = {
    connected: { color: colors.success, bg: colors.successMuted, text: label || 'Connected' },
    disconnected: { color: colors.textSecondary, bg: colors.backgroundSelected, text: label || 'Disconnected' },
    normal: { color: colors.success, bg: colors.successMuted, text: label || 'Normal' },
    abnormal: { color: colors.danger, bg: colors.dangerMuted, text: label || 'Abnormal' },
    warning: { color: colors.warning, bg: colors.warningMuted, text: label || 'Warning' },
    info: { color: colors.primary, bg: colors.primaryMuted, text: label || 'Info' },
  }[status];

  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.bg,
        paddingVertical: isSmall ? 4 : 6,
        paddingHorizontal: isSmall ? 10 : 14,
      },
    ]}>
      <View style={[styles.dot, { backgroundColor: config.color, width: isSmall ? 6 : 8, height: isSmall ? 6 : 8 }]} />
      <Text style={[styles.text, { color: config.color, fontSize: isSmall ? 11 : 13 }]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: Radius.full,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});
