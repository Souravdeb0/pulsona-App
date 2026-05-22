import React, { useCallback } from 'react';
import { View, StyleSheet, ViewProps, Platform, Pressable } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { HapticsService } from '@/services/HapticsService';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'warning';
  glass?: boolean;
  onPress?: () => void;
  blurIntensity?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CardPressable = Platform.OS === 'web' ? Pressable : AnimatedPressable;

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
  variant = 'default',
  glass = false,
  onPress,
  blurIntensity = 20,
  ...props
}) => {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
    }
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      HapticsService.light();
    }
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = [
    styles.card,
    {
      backgroundColor: glass 
        ? 'transparent' 
        : (elevated ? colors.surfaceElevated : colors.backgroundElement),
      ...(elevated ? Shadows.elevated : Shadows.subtle),
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      overflow: 'hidden' as const,
      zIndex: 1,
    },
    style,
  ];

  const content = (
    <>
      {glass && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          <BlurView
            intensity={isDark ? blurIntensity : blurIntensity + 10}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {glass && isDark && (
        <View 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: -1 }]} 
          pointerEvents="none"
        />
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <CardPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, Platform.OS !== 'web' && animatedStyle]}
        {...props}
      >
        {content}
      </CardPressable>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 20,
  },
});
