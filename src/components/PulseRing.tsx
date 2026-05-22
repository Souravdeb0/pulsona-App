import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withDelay,
  interpolate,
  Easing as ReEasing,
  runOnJS
} from 'react-native-reanimated';

interface PulseRingProps {
  color: string;
  size?: number;
  delay?: number;
  duration?: number;
  onPulse?: () => void;
  variant?: 'ring' | 'glow';
}

export const PulseRing: React.FC<PulseRingProps> = ({ 
  color, 
  size = 120, 
  delay = 0, 
  duration = 3000, 
  onPulse,
  variant = 'ring'
}) => {
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { 
          duration, 
          easing: ReEasing.bezier(0.25, 1, 0.5, 1) 
        }, (finished) => {
          if (finished && onPulse) {
            runOnJS(onPulse)();
          }
        }),
        -1,
        false
      )
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(animation.value, [0, 1], [1, variant === 'glow' ? 1.8 : 2.8]) }],
    opacity: interpolate(animation.value, [0, 1], [variant === 'glow' ? 0.3 : 0.6, 0]),
  }));

  return (
    <Reanimated.View
      style={[
        styles.pulseRing,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          borderColor: variant === 'ring' ? color : 'transparent',
          backgroundColor: variant === 'glow' ? color : 'transparent',
          borderWidth: variant === 'ring' ? 2 : 0,
        },
        animatedStyle
      ]}
    />
  );
};

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
});
