import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * HapticsService — Centralized utility for premium tactile feedback.
 * Optimized for performance and cross-platform consistency.
 */
export const HapticsService = {
  /** Light impact for general button presses and interactive cards. */
  light: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Silently fail if haptics aren't available
    }
  },

  /** Medium impact for more significant switches or tool selections. */
  medium: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Silently fail
    }
  },

  /** Selection haptic for tab bar navigation or simple picker changes. */
  selection: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // Silently fail
    }
  },

  /** Success notification for completed scans or successful pairing. */
  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Silently fail
    }
  },

  /** Error notification for failed scans or input validation etc. */
  error: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Silently fail
    }
  },

  /** Warning notification for less critical issues. */
  warning: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Silently fail
    }
  },
};
