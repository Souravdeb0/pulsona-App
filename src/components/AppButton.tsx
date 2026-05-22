import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, View, Platform } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Radius, Shadows, Gradients } from '@/constants/theme';
import { HapticsService } from '@/services/HapticsService';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'pill' | 'destructive' | 'glass';
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ButtonPressable = Platform.OS === 'web' ? Pressable : AnimatedPressable;

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconSize = 20,
  disabled = false,
  size = 'md',
  style,
}: AppButtonProps) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    opacity.value = withSpring(0.9, { damping: 20, stiffness: 300 });
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 200 });
    HapticsService.light();
  }, [disabled]);

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingHorizontal = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 16;
  const fontWeight = '600';

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          wrapper: { backgroundColor: colors.backgroundSelected, borderWidth: 1, borderColor: colors.inputBorder },
          text: { color: colors.text },
          radius: Radius.md,
        };
      case 'pill':
        return {
          wrapper: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
          text: { color: colors.primary },
          radius: Radius.full,
        };
      case 'destructive':
        return {
          wrapper: { backgroundColor: colors.danger },
          text: { color: '#ffffff' },
          radius: Radius.md,
        };
      case 'glass':
        return {
          wrapper: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.glassBorder },
          text: { color: colors.text },
          radius: Radius.md,
          isGlass: true,
        };
      case 'primary':
      default:
        return {
          wrapper: { backgroundColor: colors.primary },
          text: { color: '#ffffff' },
          radius: Radius.md,
          useGradient: true,
        };
    }
  };

  const vStyles = getVariantStyles();

  const content = (
    <View style={[styles.inner, { paddingVertical, paddingHorizontal }]}>
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={vStyles.text.color}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[styles.label, { fontSize, color: vStyles.text.color, fontWeight }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <ButtonPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.base,
        vStyles.wrapper,
        { borderRadius: vStyles.radius },
        variant === 'primary' && Shadows.glow(colors.primary),
        Platform.OS !== 'web' ? animatedStyle : { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {vStyles.useGradient && (
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: vStyles.radius }]}
        />
      )}
      {vStyles.isGlass && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: vStyles.radius, zIndex: -1 }]}>
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: vStyles.radius }]}
          />
        </View>
      )}
      {content}
    </ButtonPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: -0.2,
  },
});
