import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LiveWaveformProps {
  color?: string;
  height?: number;
  width?: number;
  isPaused?: boolean;
}

export function LiveWaveform({
  color = '#0EA5E9',
  height = 120,
  width = SCREEN_WIDTH - 80,
  isPaused = false
}: LiveWaveformProps) {
  const scrollValue = useSharedValue(0);

  useEffect(() => {
    if (isPaused) {
      scrollValue.value = 0;
      return;
    }
    scrollValue.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, [isPaused]);

  const animatedProps = useAnimatedProps(() => {
    const points: string[] = [];
    const segments = 40;
    const step = width / segments;
    
    for (let i = 0; i <= segments; i++) {
       const x = i * step;
       // Create a "pulse" wave effect
       const basePhase = (i / segments) + scrollValue.value;
       const phase = basePhase * Math.PI * 8;
       
       // Combine a few sines for a natural look
       const y1 = Math.sin(phase) * 15;
       const y2 = Math.sin(phase * 2.5) * 5;
       const y3 = Math.sin(phase * 0.5) * 8;
       
       // Add a "peak" pulse every now and then
       const pulseX = (scrollValue.value * width + x) % width;
       const peakDist = Math.abs(pulseX - width / 2);
       const peak = Math.exp(-Math.pow(peakDist / 20, 2)) * 40;
       
       const y = (height / 2) + y1 + y2 + y3 + peak;
       points.push(`${x},${y}`);
    }
    
    return {
      points: points.join(' '),
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <Stop offset="20%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="50%" stopColor={color} stopOpacity="1" />
            <Stop offset="80%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        <AnimatedPolyline
          animatedProps={animatedProps}
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
