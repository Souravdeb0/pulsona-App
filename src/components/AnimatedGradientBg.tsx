import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

interface AnimatedGradientBgProps {
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  duration?: number;
  intensity?: number;
  speed?: number; // duration in ms
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function AnimatedGradientBg({
  colors = ['#0B1120', '#0F1D32', '#0B1120'],
  style,
  children,
  duration = 6000,
  intensity = 0.15,
  speed,
}: AnimatedGradientBgProps) {
  const progress = useSharedValue(0);
  const animDuration = speed || duration;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: animDuration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [animDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: (1 - intensity) + progress.value * intensity,
    };
  });

  return (
    <AnimatedLinearGradient
      colors={colors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, animatedStyle, style]}
    >
      {children}
    </AnimatedLinearGradient>
  );
}
