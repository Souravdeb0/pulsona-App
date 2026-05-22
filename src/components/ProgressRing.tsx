import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { AppText as Text } from './AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  label?: string;
  subLabel?: string;
}

export function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress = 0.75,
  color = '#0EA5E9',
  backgroundColor = 'rgba(255,255,255,0.1)',
  label,
  subLabel,
}: ProgressRingProps) {
  const { isDark } = useAppTheme();
  const themeColors = Colors[isDark ? 'dark' : 'light'];
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={color + 'CC'} />
          </LinearGradient>
        </Defs>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glow Layer (Luminous Arc) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          fill="transparent"
          opacity={0.3}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
        {/* Progress Circle (Main Layer) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      {(label || subLabel) && (
        <View style={styles.labelContainer}>
          {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
          {subLabel && <Text style={[styles.subLabel, { color: themeColors.textSecondary }]}>{subLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    transform: Platform.OS === 'web' ? [{ rotate: '0deg' }] : [],
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  label: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: -2,
  },
});
