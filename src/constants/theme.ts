/**
 * Pulsona AI StressScope — Design System v4 (Premium Medical Glassmorphism)
 * Transitioning from Apple Minimalism to a deep, translucent, and vibrant medical aesthetic.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────
export const Colors = {
  light: {
    // Core
    text: '#1d1d1f',
    background: '#f8fafc', // Slightly cooler slate tint
    backgroundElement: '#ffffff',
    backgroundSelected: '#f1f5f9',
    textSecondary: 'rgba(30, 41, 59, 0.6)',

    // Brand / Interactive
    primary: '#0ea5e9', // Vibrant Cyan/Blue
    primaryMuted: 'rgba(14, 165, 233, 0.12)',
    accent: '#06b6d4',  // Teal-Cyan
    
    // Semantic
    danger: '#f43f5e',
    dangerMuted: 'rgba(244, 63, 94, 0.12)',
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.12)',
    info: '#3b82f6',
    infoMuted: 'rgba(59, 130, 246, 0.12)',

    // Glass (V4 Premium)
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    glassShadow: 'rgba(0, 0, 0, 0.05)',
    glassFrost: 'rgba(248, 250, 252, 0.4)',

    // Inputs
    inputBackground: '#ffffff',
    inputBorder: '#e2e8f0',
    inputFocusBorder: '#0ea5e9',
    inputFocusGlow: 'rgba(14, 165, 233, 0.15)',

    // Tab bar
    tabBar: 'rgba(255, 255, 255, 0.8)',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',

    // Card Specifics
    cardGlow: 'rgba(14, 165, 233, 0.05)',
    shimmer: 'rgba(255, 255, 255, 0.1)',
    surfaceElevated: '#ffffff',
    headerGradientStart: '#f8fafc',
    headerGradientEnd: '#f1f5f9',
    primaryDark: '#0369a1',
  },
  dark: {
    // Core
    text: '#f8fafc',
    background: '#020617', // Deep Navy/Slate
    backgroundElement: '#0f172a',
    backgroundSelected: '#1e293b',
    textSecondary: 'rgba(148, 163, 184, 0.65)',

    // Brand / Interactive
    primary: '#38bdf8', // Brighter Cyan
    primaryMuted: 'rgba(56, 189, 248, 0.15)',
    accent: '#22d3ee', 
    
    // Semantic
    danger: '#fb7185',
    dangerMuted: 'rgba(251, 113, 133, 0.15)',
    success: '#34d399',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    info: '#60a5fa',
    infoMuted: 'rgba(96, 165, 250, 0.15)',

    // Glass (V4 Premium)
    glass: 'rgba(15, 23, 42, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassShadow: 'rgba(0, 0, 0, 0.2)',
    glassFrost: 'rgba(30, 41, 59, 0.5)',

    // Inputs
    inputBackground: '#0f172a',
    inputBorder: '#1e293b',
    inputFocusBorder: '#38bdf8',
    inputFocusGlow: 'rgba(56, 189, 248, 0.25)',

    // Tab bar
    tabBar: 'rgba(2, 6, 23, 0.85)',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',

    // Card Specifics
    cardGlow: 'rgba(56, 189, 248, 0.08)',
    shimmer: 'rgba(255, 255, 255, 0.05)',
    surfaceElevated: '#1e293b',
    headerGradientStart: '#020617',
    headerGradientEnd: '#0f172a',
    primaryDark: '#075985',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Gradient Presets ───────────────────────────────────────────
export const Gradients = {
  primary: ['#0ea5e9', '#2563eb'] as const,
  primaryDark: ['#0369a1', '#1d4ed8'] as const,
  accent: ['#06b6d4', '#0891b2'] as const,
  medical: ['#22d3ee', '#0ea5e9', '#2563eb'] as const, // Triple split for depth
  success: ['#10b981', '#059669'] as const,
  danger: ['#f43f5e', '#e11d48'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
  purple: ['#8b5cf6', '#7c3aed'] as const,
  teal: ['#14b8a6', '#0d9488'] as const,
  aura: ['rgba(14, 165, 233, 0.15)', 'rgba(56, 189, 248, 0.05)', 'transparent'] as const,
  darkOverlay: ['rgba(2, 6, 23, 0.9)', 'rgba(2, 6, 23, 0.6)'] as const,
  lightOverlay: ['rgba(248, 250, 252, 0.95)', 'rgba(248, 250, 252, 0.75)'] as const,
  authDark: ['#020617', '#0f172a', '#020617'] as const,
  authLight: ['#f8fafc', '#ffffff', '#f8fafc'] as const,
} as const;

// ─── Typography Scale (Outfit Font System) ───────────────────────
const normal = undefined;

export const Typography = {
  display: { fontSize: 56, fontWeight: '700' as const, letterSpacing: -1.5, lineHeight: 62 },
  headline: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 46 },
  title: { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0.2, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, lineHeight: 14, textTransform: 'uppercase' as const },
  pill: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 },
} as const;

// ─── Border Radius Scale ─────────────────────────────────────────
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// ─── Spacing Scale ───────────────────────────────────────────────
export const Spacing = {
  half: 4,
  one: 8,
  two: 16,
  three: 24,
  four: 32,
  five: 48,
  six: 64,
  eight: 80,
  ten: 100,
} as const;

// ─── Shadow Presets (Glow based V4) ──────────────────────────────
export const Shadows = {
  subtle: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    default: { elevation: 2 },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    default: { elevation: 6 },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    default: { elevation: 12 },
  }),
  glow: (color: string = '#0ea5e9') => Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
    },
    default: { elevation: 8, shadowColor: color },
  }),
  glowStrong: (color: string = '#0ea5e9') => Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
    },
    default: { elevation: 15, shadowColor: color },
  }), 
} as const;

// ─── Animation Timing ────────────────────────────────────────────
export const Timing = {
  fast: 150,
  normal: 300,
  slow: 500,
  entrance: 600,
  staggerDelay: 100,
} as const;

// ─── Fonts ───────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'Outfit_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Outfit_400Regular',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

// ─── Layout ──────────────────────────────────────────────────────
export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 0;
export const MaxContentWidth = 1000;
