import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Typography, Spacing, Shadows } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { ALL_SCAN_CAPABILITIES } from '@/context/DeviceContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MeshBackground } from '@/components/MeshBackground';
import Reanimated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing as ReEasing
} from 'react-native-reanimated';

export default function InstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const typeId = params.type as string;
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const capability = ALL_SCAN_CAPABILITIES.find(c => c.id === typeId) || ALL_SCAN_CAPABILITIES[0];

  const glowAnim = useSharedValue(1);
  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(1, { duration: 2000, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowAnim.value }],
    opacity: 0.9 + (glowAnim.value - 1) * 2,
  }));

  const instructions: Record<string, string[]> = {
    respiratory: [
      'Sit or lie down in a quiet position.',
      'Place the device firmly against your chest, just below the collarbone.',
      'Breathe naturally and stay still during the 30-second capture.',
    ],
    lung: [
      'Ensure a silent environment for high-fidelity audio capture.',
      'Place device on the back of your chest, near the lower shoulder blade.',
      'Take deep, synchronized breaths as prompted by the AI focus.',
    ],
    heart: [
      'Rest in a seated position for at least 2 minutes prior.',
      'Place the device directly over your heart (left of the sternum).',
      'Hold the device steady with light pressure and avoid talking.',
    ],
    neck: [
      'Relax your neck muscles in an upright position.',
      'Place the device gently on the side of your neck, near the carotid.',
      'Maintain a relaxed, steady clinical breathing pattern.',
    ],
    abdomen: [
      'Lie flat on your back in a quiet, climate-controlled room.',
      'Place the device on your lower abdomen, near the navel.',
      'Avoid tensing abdominal muscles during the biometric recording.',
    ],
  };

  const steps = instructions[typeId] || instructions.respiratory;

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.backgroundSelected, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Preparation</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topInfo}>
            <Reanimated.View style={glowStyle}>
               <View style={[styles.mainIconCircle, { backgroundColor: capability.color + '20', borderColor: capability.color + '40' }]}>
                  <FontAwesome5 name={capability.icon} size={42} color={capability.color} />
                  <View style={[StyleSheet.absoluteFill, styles.iconGlow, { borderColor: capability.color }]} />
               </View>
            </Reanimated.View>
            <Text style={[styles.typeTitle, { color: colors.text }]}>{capability.title}</Text>
            <Text style={[styles.typeSubtitle, { color: colors.textSecondary }]}>
              FOLLOW THESE CLINICAL STEPS FOR MAXIMUM DIAGNOSTIC PRECISION
            </Text>
          </View>

          <View style={styles.timelineCont}>
            {steps.map((text, index) => (
              <Reanimated.View 
                key={index} 
                entering={FadeInDown.duration(600).delay(200 + index * 100)}
                style={styles.timelineItem}
              >
                <View style={styles.timelineLeft}>
                  <LinearGradient
                    colors={[capability.color, capability.color + 'AA']}
                    style={styles.timelineDot}
                  >
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </LinearGradient>
                  {index < steps.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />
                  )}
                </View>
                <Card glass blurIntensity={10} style={styles.stepCard}>
                  <Text style={[styles.stepText, { color: colors.text }]}>{text}</Text>
                </Card>
              </Reanimated.View>
            ))}
          </View>

          <Card glass blurIntensity={15} style={styles.warningBox}>
            <View style={[styles.warningIconBg, { backgroundColor: capability.color + '15' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={capability.color} />
            </View>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Ensure your Pulsona hardware is calibrated and synchronized with your clinical profile.
            </Text>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label="Initialize Capture"
            onPress={() => router.push(`/scan?type=${typeId}` as any)}
            icon="radio-outline"
            size="lg"
          />
        </View>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.subtitle,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  topInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  iconGlow: {
    borderRadius: Radius.full,
    borderWidth: 1,
    opacity: 0.3,
    margin: -8,
  },
  mainIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.glowStrong('#0ea5e940'),
  },
  typeTitle: {
    ...Typography.title,
    fontSize: 24,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  typeSubtitle: {
    ...Typography.label,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    opacity: 0.5,
  },
  timelineCont: {
    marginTop: Spacing.two,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.three,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Shadows.subtle,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  stepCard: {
    flex: 1,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  stepNumberText: {
    color: '#fff',
    ...Typography.bodyBold,
    fontSize: 14,
  },
  stepText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.three,
    marginTop: Spacing.one,
    marginBottom: Spacing.six,
    alignItems: 'center',
    gap: 12,
  },
  warningIconBg: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    ...Typography.caption,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
});
