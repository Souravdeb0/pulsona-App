import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BlobProps {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration?: number;
  delay?: number;
}

const Blob = ({ color, size, initialX, initialY, duration = 10000, delay = 0 }: BlobProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 100 - 50, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 100 - 50, {
          duration: duration * 1.2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.5, {
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          left: initialX,
          top: initialY,
        },
        animatedStyle,
      ]}
    />
  );
};

interface MeshBackgroundProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  colors?: string[];
}

export function MeshBackground({ style, children, colors: colorsProp }: MeshBackgroundProps) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const blobs = useMemo(() => {
    const baseColors = colorsProp || (isDark ? ['#0ea5e9', '#2563eb', '#1e293b'] : ['#38bdf8', '#bae6fd', '#e0f2fe']);
    if (isDark) {
      return [
        { color: baseColors[0] || '#0ea5e9', size: 300, x: -50, y: -50, delay: 0 },
        { color: baseColors[1] || '#2563eb', size: 250, x: SCREEN_WIDTH - 150, y: 100, delay: 1000 },
        { color: baseColors[2] || '#1e293b', size: 350, x: 50, y: SCREEN_HEIGHT - 300, delay: 2000 },
      ];
    } else {
      return [
        { color: baseColors[0] || '#38bdf8', size: 300, x: -100, y: 0, delay: 0 },
        { color: baseColors[1] || '#bae6fd', size: 250, x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT / 3, delay: 500 },
        { color: baseColors[2] || '#e0f2fe', size: 400, x: -50, y: SCREEN_HEIGHT - 200, delay: 1500 },
      ];
    }
  }, [isDark, colorsProp]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {blobs.map((blob, i) => (
          <Blob
            key={i}
            color={blob.color}
            size={blob.size}
            initialX={blob.x}
            initialY={blob.y}
            delay={blob.delay}
            duration={8000 + i * 2000}
          />
        ))}
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    opacity: 0.4,
  },
});
