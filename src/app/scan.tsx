import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Shadows, Typography, Spacing } from '@/constants/theme';
import { ALL_SCAN_CAPABILITIES } from '@/context/DeviceContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '@/services/HapticsService';
import { AudioService } from '@/services/AudioService';
import { MeshBackground } from '@/components/MeshBackground';
import { PulseRing } from '@/components/PulseRing';
import Reanimated, { 
  FadeIn, 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing as ReEasing,
  interpolate,
} from 'react-native-reanimated';
import { LiveWaveform } from '@/components/LiveWaveform';
import { useAuth } from '@/context/AuthContext';
import { PulsonaSocket } from '@/services/SocketService';
import { ESPService } from '@/services/ESPService';
import { useDevice } from '@/context/DeviceContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Breathing animated circle behind the main icon
function BreathingCircle({ color, size }: { color: string; size: number }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(0, { duration: 2200, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.85, 1.15]) }],
    opacity: interpolate(anim.value, [0, 1], [0.15, 0.4]),
  }));

  return (
    <Reanimated.View
      style={[{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }, animatedStyle]}
    />
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const typeId = params.type as string;
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { user } = useAuth();
  const { espIP } = useDevice();

  const capability = ALL_SCAN_CAPABILITIES.find(c => c.id === typeId) || ALL_SCAN_CAPABILITIES[0];

  const [scanStatus, setScanStatus] = useState<'recording' | 'analyzing' | 'complete'>('recording');
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); 
  const [sessionId, setSessionId] = useState<string | null>(null);
  const totalDuration = 15;

  // Spinning loader for analyzing state
  const spinAnim = useSharedValue(0);
  useEffect(() => {
    if (scanStatus === 'analyzing') {
      spinAnim.value = withRepeat(
        withTiming(1, { duration: 2000, easing: ReEasing.linear }),
        -1,
        false
      );
    }
  }, [scanStatus]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(spinAnim.value, [0, 1], [0, 360])}deg` }],
  }));

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    PulsonaSocket.connect(user.id);
    AudioService.startScanAudio(typeId);
    AudioService.init();

    // Create backend session and start ESP32 recording
    const initRecording = async () => {
      if (espIP) {
        const sid = await ESPService.orchestrateRecording(
          user.id,
          capability.title,
          (createdSessionId) => {
            if (isMounted) setSessionId(createdSessionId);
          }
        );
        if (sid && isMounted) setSessionId(sid);
      }
    };
    initRecording();

    PulsonaSocket.onInferenceComplete((data) => {
      if (!isMounted) return;
      setScanStatus('complete');
      HapticsService.success();
      
      setTimeout(() => {
        router.replace({
          pathname: '/results',
          params: { 
            type: typeId,
            result: JSON.stringify(data.scan)
          }
        } as any);
      }, 1000);
    });

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setScanStatus('analyzing');
          return 0;
        }
        return prev - 1;
      });

      if (scanStatus === 'recording') {
        setProgress(prev => Math.min(prev + (1 / totalDuration), 1));
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      AudioService.stopScanAudio();
      PulsonaSocket.offInferenceComplete();
    };
  }, [user, scanStatus]);

  // When recording ends, finalize the ESP session
  useEffect(() => {
    if (scanStatus === 'analyzing' && sessionId) {
      ESPService.finalizeRecording(sessionId).then((success) => {
        if (!success) {
          console.warn('[Scan] Failed to finalize ESP recording session');
        }
      });
    }
  }, [scanStatus, sessionId]);

  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [
              styles.closeBtn, 
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitleCont}>
            <View style={[styles.headerBadge, { backgroundColor: scanStatus === 'recording' ? capability.color + '20' : colors.warningMuted }]}>
              <View style={[styles.headerBadgeDot, { backgroundColor: scanStatus === 'recording' ? capability.color : colors.warning }]} />
              <Text style={[styles.headerBadgeText, { color: scanStatus === 'recording' ? capability.color : colors.warning }]}>
                {scanStatus === 'recording' ? 'LIVE' : 'PROCESSING'}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{capability.title}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Dynamic Visualization Area */}
        <View style={styles.vizContainer}>
          <View style={styles.ringsWrapper}>
            <BreathingCircle color={capability.color} size={200} />
            <PulseRing color={capability.color} size={160} delay={0} duration={3500} variant="glow" />
            <PulseRing color={capability.color} size={160} delay={1500} duration={3500} variant="ring" />
            
            <LinearGradient
               colors={[capability.color + '60', capability.color]}
               style={styles.innerCircle}
            >
               <LinearGradient 
                 colors={['rgba(255,255,255,0.35)', 'transparent']}
                 style={styles.innerCircleHighlight}
               />
               {scanStatus === 'recording' ? (
                 <Ionicons name="medical" size={40} color="#fff" />
               ) : (
                 <Reanimated.View style={spinStyle}>
                   <Ionicons name="sync" size={36} color="#fff" />
                 </Reanimated.View>
               )}
            </LinearGradient>
          </View>

          {/* Waveform Container */}
          <Reanimated.View entering={FadeIn.delay(400)} style={styles.waveformWrapper}>
             <LiveWaveform color={capability.color} />
          </Reanimated.View>
        </View>

        {/* Bottom Status Info */}
        <View style={styles.footer}>
           <Reanimated.View entering={FadeInDown.delay(200)} style={styles.timerContainer}>
             {scanStatus === 'recording' ? (
               <>
                 <Text style={[styles.timerValue, { color: colors.text }]}>{formattedTime}</Text>
                 <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Seconds Remaining</Text>
               </>
             ) : (
               <View style={styles.analyzingLoader}>
                 <ActivityIndicator size="large" color={capability.color} />
                 <Text style={[styles.analyzingText, { color: colors.text }]}>Processing Audio</Text>
                 <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Running neural network inference...</Text>
               </View>
             )}
           </Reanimated.View>

           {/* Progress Bar */}
           <View style={styles.progressSection}>
             <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
               <LinearGradient
                 colors={[capability.color + '80', capability.color]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
                 style={[styles.progressFill, { width: `${progress * 100}%` }]}
               />
               {/* Glowing tip */}
               {progress > 0 && progress < 1 && (
                 <View style={[styles.progressGlow, { left: `${progress * 100}%`, backgroundColor: capability.color }]} />
               )}
             </View>
             <View style={styles.progressLabels}>
               <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                 {scanStatus === 'recording' ? `${Math.round(progress * 100)}% captured` : 'Analyzing biometrics...'}
               </Text>
               {scanStatus === 'recording' && (
                 <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                   {timeLeft}s left
                 </Text>
               )}
             </View>
           </View>

           {/* Status Chip */}
           <View style={[styles.statusChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
             <View style={[styles.statusDot, { backgroundColor: capability.color }]} />
             <Text style={[styles.statusText, { color: colors.textSecondary }]}>
               {scanStatus === 'recording' 
                 ? 'Capturing high-fidelity bio-telemetry' 
                 : 'Running TFLite neural inference engine'}
             </Text>
           </View>
        </View>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  
  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitleCont: { alignItems: 'center' },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, gap: 6,
    marginBottom: 4,
  },
  headerBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  headerBadgeText: { ...Typography.pill, fontSize: 11, letterSpacing: 1 },
  subtitle: { ...Typography.caption, opacity: 0.7 },

  // ─── Visualization ───
  vizContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringsWrapper: {
    width: 200, height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  innerCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Shadows.glowStrong('#0ea5e9'),
  },
  innerCircleHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 50,
    margin: 4,
  },
  waveformWrapper: {
    height: 120,
    width: '100%',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },

  // ─── Footer ───
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    ...Typography.label,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
  },
  analyzingLoader: { alignItems: 'center', paddingVertical: Spacing.one },
  analyzingText: {
    ...Typography.bodyBold, fontSize: 16,
    marginTop: Spacing.two,
    letterSpacing: -0.3,
  },

  // ─── Progress Bar ───
  progressSection: { marginBottom: Spacing.three },
  progressTrack: {
    height: 6, borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressGlow: {
    position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6,
    marginLeft: -6,
    opacity: 0.6,
  },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  progressText: { ...Typography.caption, fontSize: 11, opacity: 0.5 },

  // ─── Status Chip ───
  statusChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.full,
    gap: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.caption, fontSize: 12 },
});
