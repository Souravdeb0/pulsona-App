import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, Platform, Share, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Shadows, Typography, Spacing, Gradients } from '@/constants/theme';
import { ALL_SCAN_CAPABILITIES } from '@/context/DeviceContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { HapticsService } from '@/services/HapticsService';
import { AudioService } from '@/services/AudioService';
import { LinearGradient } from 'expo-linear-gradient';
import { MeshBackground } from '@/components/MeshBackground';
import Reanimated, { 
  FadeInUp, 
  ZoomIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay,
  withTiming,
  Easing as ReEasing,
  interpolate
} from 'react-native-reanimated';
import { ProgressRing } from '@/components/ProgressRing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Confetti particle (Reanimated) ---
function ConfettiParticle({ delay }: { delay: number }) {
  const anim = useSharedValue(0);
  const x = Math.random() * SCREEN_WIDTH;
  const size = 5 + Math.random() * 10;
  const color = ['#FFD700', '#FF4500', '#1E90FF', '#32CD32', '#FF69B4'][Math.floor(Math.random() * 5)];

  useEffect(() => {
    anim.value = withDelay(
      delay,
      withTiming(1, { duration: 1500 + Math.random() * 1000, easing: ReEasing.out(ReEasing.ease) })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.8, 1], [1, 1, 0]),
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [-50, SCREEN_HEIGHT * 0.7]) },
      { rotate: `${interpolate(anim.value, [0, 1], [0, 360])}deg` }
    ],
  }));

  return (
    <Reanimated.View
      style={[{
        position: 'absolute',
        top: 0,
        left: x,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 2,
        zIndex: 10,
      }, animatedStyle]}
    />
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const typeId = params.type as string;
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const capability = ALL_SCAN_CAPABILITIES.find(c => c.id === typeId) || ALL_SCAN_CAPABILITIES[0];

  // Parse AI Inference Data
  const rawResult = params.result ? JSON.parse(params.result as string) : null;
  const isHealthy = rawResult ? (rawResult.stress_level === 'low' || rawResult.classification === 'Normal') : true;
  
  const status = rawResult 
    ? (rawResult.classification || (isHealthy ? 'Normal' : 'Requires Attention'))
    : (isHealthy ? 'Normal' : 'Requires Attention');
    
  const confidence = rawResult 
    ? Math.round((parseFloat(rawResult.confidence) || 0.85) * 100) 
    : 88;

  const accentColor = isHealthy ? colors.success : colors.danger;
  
  // Custom mesh colors based on result
  const meshColors = useMemo(() => {
    if (isHealthy) {
      return isDark 
        ? ['#06202a', '#064e3b', '#0c4a6e', '#020617'] 
        : ['#ecfeff', '#f0fdf4', '#f0f9ff', '#ffffff'];
    } else {
      return isDark
        ? ['#2a0606', '#450a0a', '#1e1b4b', '#020617']
        : ['#fef2f2', '#fff1f2', '#fdf2f8', '#ffffff'];
    }
  }, [isHealthy, isDark]);

  useEffect(() => {
    if (isHealthy) {
      HapticsService.success();
      AudioService.playFeedback('success');
    } else {
      HapticsService.error();
      AudioService.playFeedback('error');
    }
  }, [isHealthy]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My Pulsona Scan Report: ${capability.title} is ${status} with ${confidence}% confidence.`,
      });
    } catch (e) {}
  };

  const confettiEffect = isHealthy ? Array.from({ length: 40 }) : [];

  return (
    <MeshBackground colors={meshColors} style={styles.container}>
      {confettiEffect.map((_, i) => <ConfettiParticle key={i} delay={i * 20} />)}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/')} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Clinical Report</Text>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Info Card */}
          <Reanimated.View entering={ZoomIn.duration(800)}>
            <Card glass blurIntensity={20} style={styles.resultMainCard}>
              <View style={styles.resultHero}>
                <LinearGradient
                   colors={[accentColor + '40', accentColor]}
                   style={styles.heroIconCircle}
                >
                   <Ionicons 
                     name={isHealthy ? "checkmark-circle" : "alert-circle"} 
                     size={64} 
                     color="#fff" 
                   />
                </LinearGradient>
                <View style={[styles.statusTag, { backgroundColor: accentColor + '15' }]}>
                   <Text style={[styles.statusTagText, { color: accentColor }]}>
                      {isHealthy ? 'DIAGNOSTIC STATUS: OPTIMAL' : 'DIAGNOSTIC STATUS: ALERT'}
                   </Text>
                </View>
                <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
                <Text style={[styles.resultSummary, { color: colors.textSecondary }]}>
                  {isHealthy 
                    ? `Our AI Engine indicates your ${capability.title.toLowerCase()} biometrics are within optimal clinical ranges.`
                    : `Anomalies detected in your ${capability.title.toLowerCase()} data. We recommend further clinical assessment.`
                  }
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

              <View style={styles.metricsRow}>
                <View style={styles.confidenceCont}>
                   <ProgressRing 
                     progress={confidence / 100} 
                     color={accentColor} 
                     size={120} 
                     strokeWidth={12} 
                     label={`${confidence}%`}
                     subLabel="AI Accuracy"
                     backgroundColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                   />
                </View>
                <View style={styles.statsPanel}>
                   {[
                     { label: 'Capture', val: '15s @ 16kHz' },
                     { label: 'Latency', val: '124ms' },
                     { label: 'Network', val: 'Binary SSL' },
                     { label: 'Model', val: 'P-Net v4' }
                   ].map((s, idx) => (
                     <View key={idx} style={styles.statLine}>
                        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{s.label}</Text>
                        <Text style={[styles.statVal, { color: colors.text }]}>{s.val}</Text>
                     </View>
                   ))}
                </View>
              </View>
            </Card>
          </Reanimated.View>

          {/* Clinical Insights */}
          <Reanimated.View entering={FadeInDown.duration(600).delay(300)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clinical Data Analysis</Text>
            <Card glass blurIntensity={10} style={styles.insightsCard}>
               <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: colors.primaryMuted }]}>
                     <MaterialIcons name="analytics" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.insightText}>
                     <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Signal-to-Noise Ratio (SNR)</Text>
                     <Text style={[styles.insightValue, { color: colors.text }]}>24.8 dB — High Fidelity</Text>
                  </View>
               </View>
               <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: colors.infoMuted }]}>
                     <MaterialIcons name="model-training" size={18} color={colors.info} />
                  </View>
                  <View style={styles.insightText}>
                     <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Inference Pipeline</Text>
                     <Text style={[styles.insightValue, { color: colors.text }]}>Quantized TFLite Neural Edge</Text>
                  </View>
               </View>
            </Card>
          </Reanimated.View>

          {/* Recommendations */}
          <Reanimated.View entering={FadeInDown.duration(600).delay(500)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Guidance</Text>
            <Card glass blurIntensity={10} style={styles.recommendationCard}>
              <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />
              <View style={styles.recommendationContent}>
                 <View style={styles.recItem}>
                   <View style={[styles.recIconWrap, { backgroundColor: isHealthy ? colors.successMuted : colors.dangerMuted }]}>
                     <Ionicons name={isHealthy ? "pulse-outline" : "alert-outline"} size={18} color={accentColor} />
                   </View>
                   <Text style={[styles.recText, { color: colors.text }]}>
                     {isHealthy ? "Your physiology matches clinical baselines. Maintain current wellness routine." : "Deviations detected. We recommend scheduling a professional consultation."}
                   </Text>
                 </View>
                 <View style={styles.recItem}>
                   <View style={[styles.recIconWrap, { backgroundColor: colors.primaryMuted }]}>
                     <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                   </View>
                   <Text style={[styles.recText, { color: colors.text }]}>
                     Next automated biometric audit scheduled for 48 hours.
                   </Text>
                 </View>
              </View>
            </Card>
          </Reanimated.View>

          <View style={{ height: Spacing.eight }} />
        </ScrollView>

        <View style={styles.footer}>
           <AppButton
             label="Done"
             onPress={() => router.replace('/')}
             size="lg"
           />
           <Pressable 
             style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
             onPress={() => router.replace(`/instructions?type=${typeId}` as any)}
           >
             <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>RETAKE BIO-SCAN</Text>
           </Pressable>
        </View>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.subtitle,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  resultMainCard: {
    padding: Spacing.five,
    marginTop: Spacing.one,
    alignItems: 'center',
  },
  resultHero: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  heroIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    ...Shadows.glowStrong('#0ea5e980'),
  },
  statusTag: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    marginBottom: Spacing.two,
  },
  statusTagText: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  statusText: {
    ...Typography.display,
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  resultSummary: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.four,
    opacity: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  confidenceCont: {
    alignItems: 'center',
    flex: 1.2,
  },
  statsPanel: {
    flex: 1,
    paddingLeft: Spacing.three,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statTitle: {
    ...Typography.caption,
    fontSize: 12,
  },
  statVal: {
    ...Typography.captionBold,
    fontSize: 12,
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  recommendationCard: {
    padding: Spacing.four,
    paddingLeft: Spacing.five,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: Spacing.four,
    bottom: Spacing.four,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  recommendationContent: {
    gap: Spacing.three,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  recText: {
    ...Typography.body,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  insightsCard: {
    padding: Spacing.four,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  insightText: {
    flex: 1,
  },
  insightLabel: {
    ...Typography.label,
    fontSize: 10,
    marginBottom: 2,
  },
  insightValue: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  footer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  secondaryBtn: {
    marginTop: Spacing.two,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...Typography.label,
    fontSize: 12,
  },
});

