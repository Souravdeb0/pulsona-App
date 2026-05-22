import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, TextInput, ActivityIndicator, Alert, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography, Spacing, Shadows, Gradients } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PulsonaAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '@/services/HapticsService';
import { MeshBackground } from '@/components/MeshBackground';
import Reanimated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing as ReEasing
} from 'react-native-reanimated';

const { width: INITIAL_SCREEN_WIDTH } = Dimensions.get('window');

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SMOKING_STATUSES = ['Never', 'Former', 'Current'];

const AGE_OPTIONS = Array.from({ length: 101 }, (_, i) => i.toString().padStart(2, '0'));
const HEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => (i + 100).toString());
const WEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => (i + 30).toString());

const ITEM_HEIGHT = 44;
const VISIBLE_HEIGHT = 132;

function VerticalScrollPicker({
  options,
  value,
  onChange,
  accentColor,
  colors,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  accentColor: string;
  colors: any;
}) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const isProgrammaticScroll = React.useRef(false);
  const scrollTimeout = React.useRef<any>(null);

  const getIndexFromValue = (val: string) => {
    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
      const closestInt = Math.round(numValue);
      return options.indexOf(closestInt.toString());
    }
    return options.indexOf(val);
  };

  const initialIndex = Math.max(0, getIndexFromValue(value));
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const containerPadding = VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2;

  useEffect(() => {
    const index = getIndexFromValue(value);

    if (index !== -1) {
      setActiveIndex(index);
      isProgrammaticScroll.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      scrollViewRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });

      scrollTimeout.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 300);
    } else if (!value) {
      const defaultVal = options.includes('170') ? '170' : options.includes('70') ? '70' : options[Math.floor(options.length / 2)];
      const defaultIndex = options.indexOf(defaultVal);
      if (defaultIndex !== -1) {
        scrollViewRef.current?.scrollTo({
          y: defaultIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }
  }, [value]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < options.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleScrollEnd = (event: any) => {
    if (isProgrammaticScroll.current) return;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < options.length) {
      const selectedVal = options[index];
      if (selectedVal !== value) {
        onChange(selectedVal);
      }
      scrollViewRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.pickerContainer}>
      <View style={[styles.centerIndicator, { borderColor: accentColor }]} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: containerPadding,
          alignItems: 'center',
        }}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {options.map((opt, idx) => {
          const distance = Math.abs(idx - activeIndex);
          let opacity = 0;
          let scale = 0.8;
          let isSelected = false;

          if (distance === 0) {
            opacity = 1;
            scale = 1.25;
            isSelected = true;
          } else if (distance === 1) {
            opacity = 0.55;
            scale = 0.95;
          } else if (distance === 2) {
            opacity = 0.2;
            scale = 0.8;
          }

          return (
            <Pressable
              key={opt}
              style={{ width: '100%', height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => {
                onChange(opt);
              }}
            >
              <Text
                style={[
                  styles.pickerText,
                  {
                    opacity,
                    transform: [{ scale }],
                    color: isSelected ? accentColor : colors.text,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  },
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Pulsing ring for active step icon (Reanimated v4)
function StepAura({ color, active }: { color: string; active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (!active) {
      scale.value = 1;
      opacity.value = 0;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: ReEasing.out(ReEasing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: ReEasing.out(ReEasing.ease) }),
        withTiming(0.4, { duration: 0 })
      ),
      -1,
      false
    );
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function SlideContent({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  if (Platform.OS === 'web') {
    return <View style={styles.slideContent}>{children}</View>;
  }
  return (
    <Reanimated.View entering={FadeInDown.duration(800).delay(delay)} style={styles.slideContent}>
      {children}
    </Reanimated.View>
  );
}

const SlidesContainer = Platform.OS === 'web' ? View : Reanimated.View;

export default function OnboardingScreen() {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const slideAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  const [age, setAge] = useState('00');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [smokingStatus, setSmokingStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { completeOnboarding } = useAuth();
  const totalSteps = 7;

  useEffect(() => {
    progressAnim.value = withTiming((step + 1) / totalSteps, { duration: 400 });
  }, [step]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      slideAnim.value = -step * windowWidth;
    }
  }, [windowWidth, step]);

  const animateToStep = (nextStep: number) => {
    if (Platform.OS === 'web') {
      setStep(nextStep);
    } else {
      slideAnim.value = withSpring(-nextStep * windowWidth, { damping: 20, stiffness: 100 });
      setStep(nextStep);
    }
    HapticsService.light();
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Platform.OS === 'web' ? 0 : slideAnim.value }],
  }));

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await PulsonaAPI.updateProfile({
        age: parseInt(age) || 0,
        gender,
        bloodType,
        height: parseInt(height) || undefined,
        weight: parseFloat(weight) || undefined,
        smokingStatus: smokingStatus || undefined,
      });
      await completeOnboarding();
      router.replace('/');
    } catch (e) {
      Alert.alert('Save Failed', 'Couldn\'t save your profile. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return age.length > 0;
      case 2: return gender.length > 0;
      case 3: return bloodType.length > 0;
      case 4: return height.length > 0;
      case 5: return weight.length > 0;
      case 6: return smokingStatus.length > 0;
      default: return true;
    }
  };

  const renderOptionChip = (label: string, selected: boolean, onPress: () => void, accentColor?: string) => {
    const activeColor = accentColor || colors.primary;
    return (
      <Pressable
        key={label}
        style={({ pressed }) => [
          styles.optionChip,
          {
            backgroundColor: selected ? activeColor : colors.backgroundSelected,
            borderColor: selected ? activeColor : colors.glassBorder,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={onPress}
      >
        <Text style={[styles.optionText, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Progress Header */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressCurrentLabel, { color: colors.text }]}>Step {step + 1}</Text>
          <View style={styles.progressTrackWrapper}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSelected }]}>
              <Reanimated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={Gradients.primary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Reanimated.View>
            </View>
          </View>
          <Text style={[styles.progressTotalLabel, { color: colors.textSecondary }]}>{totalSteps}</Text>
        </View>

        {/* Sliding Pages */}
        <SlidesContainer style={[styles.slidesWrapper, Platform.OS !== 'web' && slideStyle]}>
          {/* Step 0: Welcome */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 0 && { display: 'none' }
          ]}>
            <SlideContent>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.primary} active={step === 0} />
                <LinearGradient
                  colors={[colors.primary + '40', colors.primary + '10']}
                  style={styles.welcomeIconCircle}
                >
                  <FontAwesome5 name="stethoscope" size={54} color={colors.primary} />
                </LinearGradient>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Clinical Setup</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Initializing your biometric profile for high-fidelity medical monitoring and real-time AI assessments.
              </Text>
            </SlideContent>
          </View>

          {/* Step 1: Age */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 1 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.success} active={step === 1} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="calendar-outline" size={38} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Global Age</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Calibrating baseline biometric frequencies based on your chronological age.
              </Text>
              <Card glass blurIntensity={15} style={styles.inputCard}>
                <TextInput
                  style={[styles.ageInput, { color: colors.text, zIndex: 10, position: 'relative' }]}
                  placeholder="24"
                  placeholderTextColor={colors.textSecondary + '40'}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  maxLength={3}
                  pointerEvents="auto"
                />
              </Card>
              <VerticalScrollPicker
                options={AGE_OPTIONS}
                value={age}
                onChange={setAge}
                accentColor={colors.success}
                colors={colors}
              />
            </SlideContent>
          </View>

          {/* Step 2: Gender */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 2 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.primary} active={step === 2} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="person-outline" size={38} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Identity</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Personalizing health insights using clinical gender standards.
              </Text>
              <View style={styles.optionGrid}>
                {GENDERS.map((g) => renderOptionChip(g, gender === g, () => setGender(g)))}
              </View>
            </SlideContent>
          </View>

          {/* Step 3: Blood Type */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 3 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.danger} active={step === 3} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="heart-outline" size={38} color={colors.danger} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Blood Type</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Crucial for emergency synchronization and predictive analytics.
              </Text>
              <View style={styles.bloodGrid}>
                {BLOOD_TYPES.map((bt) => (
                  <Pressable
                    key={bt}
                    style={({ pressed }) => [
                      styles.bloodChip,
                      {
                        backgroundColor: bloodType === bt ? colors.danger : colors.backgroundSelected,
                        borderColor: bloodType === bt ? colors.danger : colors.glassBorder,
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                      },
                    ]}
                    onPress={() => setBloodType(bt)}
                  >
                    <Text style={[styles.bloodText, { color: bloodType === bt ? '#fff' : colors.text }]}>{bt}</Text>
                  </Pressable>
                ))}
              </View>
            </SlideContent>
          </View>

          {/* Step 4: Height */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 4 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.primary} active={step === 4} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="body-outline" size={38} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Vertical Reach</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Height integration for lung capacity modeling and structural diagnostics.
              </Text>
              <Card glass blurIntensity={15} style={styles.inputCard}>
                <View style={styles.inputWithUnitWrapper}>
                  <TextInput
                    style={[styles.measurementInput, { color: colors.text, zIndex: 10, position: 'relative' }]}
                    placeholder="175"
                    placeholderTextColor={colors.textSecondary + '40'}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    maxLength={3}
                    pointerEvents="auto"
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>CM</Text>
                </View>
              </Card>
              <VerticalScrollPicker
                options={HEIGHT_OPTIONS}
                value={height}
                onChange={setHeight}
                accentColor={colors.primary}
                colors={colors}
              />
            </SlideContent>
          </View>

          {/* Step 5: Weight */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 5 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.warning} active={step === 5} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="barbell-outline" size={38} color={colors.warning} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Metabolic Load</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Integrating body mass for optimized stress-response calibration.
              </Text>
              <Card glass blurIntensity={15} style={styles.inputCard}>
                <View style={styles.inputWithUnitWrapper}>
                  <TextInput
                    style={[styles.measurementInput, { color: colors.text, zIndex: 10, position: 'relative' }]}
                    placeholder="70.5"
                    placeholderTextColor={colors.textSecondary + '40'}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    maxLength={5}
                    pointerEvents="auto"
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>KG</Text>
                </View>
              </Card>
              <VerticalScrollPicker
                options={WEIGHT_OPTIONS}
                value={weight}
                onChange={setWeight}
                accentColor={colors.warning}
                colors={colors}
              />
            </SlideContent>
          </View>

          {/* Step 6: Smoking */}
          <View style={[
            styles.slide, 
            Platform.OS === 'web' ? { width: '100%', flex: 1 } : { width: windowWidth },
            Platform.OS === 'web' && step !== 6 && { display: 'none' }
          ]}>
            <SlideContent delay={100}>
              <View style={styles.auraWrapper}>
                <StepAura color={colors.danger} active={step === 6} />
                <View style={[styles.stepIconCircle, { backgroundColor: colors.danger + '15' }]}>
                  <FontAwesome5 name="smoking" size={30} color={colors.danger} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Pulmonary Status</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Defining baseline acoustic filters for pulmonary sound classification.
              </Text>
              <View style={styles.smokingGrid}>
                {SMOKING_STATUSES.map((status) => renderOptionChip(status, smokingStatus === status, () => setSmokingStatus(status), colors.danger))}
              </View>
            </SlideContent>
          </View>
        </SlidesContainer>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {step > 0 && (
            <Pressable
              style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.backgroundSelected, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => animateToStep(step - 1)}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          )}

          <View style={{ flex: 1, marginLeft: step > 0 ? 12 : 0 }}>
            <AppButton
              label={isSaving ? '' : (step === 0 ? 'START SETUP' : step === totalSteps - 1 ? 'COMPLETE PROFILE' : 'CONTINUE')}
              onPress={() => {
                if (!canProceed() || isSaving) return;
                if (step < totalSteps - 1) animateToStep(step + 1);
                else handleFinish();
              }}
              disabled={!canProceed() || isSaving}
              icon={step < totalSteps - 1 ? 'arrow-forward' : undefined}
              size="lg"
            />
            {isSaving && <ActivityIndicator size="small" color="#fff" style={{ position: 'absolute', alignSelf: 'center', top: 18 }} />}
          </View>
        </View>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 12,
  },
  progressCurrentLabel: {
    ...Typography.label,
    fontSize: 10,
    width: 45,
  },
  progressTrackWrapper: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressTotalLabel: {
    ...Typography.label,
    fontSize: 10,
    width: 20,
    textAlign: 'center',
    opacity: 0.5,
  },
  slidesWrapper: { flex: 1, flexDirection: 'row' },
  slide: { paddingHorizontal: Spacing.four },
  slideContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  auraWrapper: { justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.six, width: 100, height: 100 },
  welcomeIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glowStrong('#0ea5e960'),
  },
  welcomeTitle: { 
    ...Typography.display,
    fontSize: 32,
    textAlign: 'center', 
    marginBottom: Spacing.two,
  },
  welcomeSubtitle: { 
    ...Typography.body,
    textAlign: 'center', 
    lineHeight: 24, 
    paddingHorizontal: Spacing.two,
    opacity: 0.7,
  },
  stepIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepTitle: { 
    ...Typography.title,
    fontSize: 26,
    textAlign: 'center', 
    marginBottom: Spacing.one,
  },
  stepSubtitle: { 
    ...Typography.body,
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: Spacing.five, 
    paddingHorizontal: Spacing.one,
    opacity: 0.6,
  },
  inputCard: { 
    width: '100%', 
    padding: Spacing.four,
  },
  ageInput: { 
    padding: Spacing.two,
    ...Typography.display,
    fontSize: 32, 
    textAlign: 'center',
  },
  inputWithUnitWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  measurementInput: { 
    padding: Spacing.two,
    ...Typography.display,
    fontSize: 32, 
    textAlign: 'center',
  },
  inputUnit: { 
    ...Typography.label,
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.4,
  },
  optionGrid: { 
    flexDirection: 'row', 
    gap: 12, 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    width: '100%',
  },
  optionChip: { 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: Radius.xxl, 
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  optionText: { 
    ...Typography.bodyBold,
    fontSize: 15,
  },
  bloodGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 12,
    width: '100%',
  },
  bloodChip: { 
    width: 70, 
    height: 50, 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  bloodText: { 
    ...Typography.bodyBold,
    fontSize: 16,
  },
  smokingGrid: { 
    gap: 12, 
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
    alignItems: 'center',
  },
  backBtn: { 
    width: 56, 
    height: 56, 
    borderRadius: Radius.full, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  pickerContainer: {
    height: 132,
    width: 120,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 15,
    overflow: 'hidden',
  },
  centerIndicator: {
    position: 'absolute',
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignSelf: 'center',
    top: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerText: {
    ...Typography.body,
    fontSize: 18,
  },
});
