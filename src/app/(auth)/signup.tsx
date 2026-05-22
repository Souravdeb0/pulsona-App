import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Animated, Easing } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Colors, Gradients, Radius, Shadows } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { FontAwesome5 } from '@expo/vector-icons';
import { PulsonaAPI } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  withDelay,
  interpolate,
  Easing as ReEasing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '@/services/HapticsService';

// Floating decorative particle (Reanimated)
function FloatingParticle({ delay, size, x, y, color }: { delay: number; size: number; x: number; y: number; color: string }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 4000 + Math.random() * 2000, easing: ReEasing.inOut(ReEasing.sin) }),
          withTiming(0, { duration: 4000 + Math.random() * 2000, easing: ReEasing.inOut(ReEasing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.15, 0.35]),
    transform: [{ translateY: interpolate(anim.value, [0, 1], [0, -20]) }],
  }));

  return (
    <Reanimated.View
      style={[{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }, animatedStyle]}
    />
  );
}

export default function SignupScreen() {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const glowAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.08, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      if (!name || !email || !password) throw new Error('Please fill all fields');
      await PulsonaAPI.signup(name, email, password);
      router.replace('/(auth)/login');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const particles = [
    { delay: 200, size: 10, x: 15, y: 12, color: colors.primary + '35' },
    { delay: 800, size: 8, x: 80, y: 25, color: colors.accent + '30' },
    { delay: 1200, size: 12, x: 65, y: 65, color: colors.primary + '25' },
    { delay: 600, size: 6, x: 25, y: 80, color: colors.accent + '40' },
    { delay: 1800, size: 14, x: 50, y: 8, color: colors.primary + '20' },
  ];

  return (
    <View style={styles.container}>
      
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Reanimated.View entering={FadeInDown.duration(600).delay(100)} style={styles.brandContainer}>
            <Animated.View style={{ transform: [{ scale: glowAnim }] }}>
              <LinearGradient
                colors={isDark ? ['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.05)'] : ['rgba(14, 165, 233, 0.15)', 'rgba(14, 165, 233, 0.03)']}
                style={styles.iconOuterGlow}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
                  <FontAwesome5 name="user-plus" size={34} color={colors.primary} />
                </View>
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Join Pulsona Healthcare</Text>
          </Reanimated.View>

          <Reanimated.View entering={FadeInUp.duration(600).delay(200)}>
            <Card elevated style={styles.card}>
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted }]}>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <Reanimated.View entering={FadeInDown.duration(600).delay(400)}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { borderColor: nameFocused ? colors.inputFocusBorder : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="John Doe"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => { setNameFocused(true); HapticsService.selection(); }}
                    onBlur={() => setNameFocused(false)}
                    />
                </View>
              </Reanimated.View>

              <Reanimated.View entering={FadeInDown.duration(600).delay(500)}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                <View style={[styles.inputWrapper, { borderColor: emailFocused ? colors.inputFocusBorder : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => { setEmailFocused(true); HapticsService.selection(); }}
                    onBlur={() => setEmailFocused(false)}
                    />
                </View>
              </Reanimated.View>

              <Reanimated.View entering={FadeInDown.duration(600).delay(600)}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: passwordFocused ? colors.inputFocusBorder : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => { setPasswordFocused(true); HapticsService.selection(); }}
                    onBlur={() => setPasswordFocused(false)}
                    />
                </View>
              </Reanimated.View>

              <Reanimated.View entering={FadeInDown.duration(600).delay(700)}>
                <AppButton
                    label={loading ? '' : 'Create Account'}
                    onPress={() => { HapticsService.light(); handleSignup(); }}
                    disabled={loading}
                    size="md"
                    
                    style={{ marginTop: 4 }}
                />
                {loading && (
                    <ActivityIndicator color="#fff" style={{ position: 'absolute', top: 18, alignSelf: 'center' }} />
                )}
              </Reanimated.View>
            </Card>
          </Reanimated.View>

          <Reanimated.View entering={FadeInUp.duration(500).delay(500)} style={styles.footer}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15 }}>Log In</Text>
            </Pressable>
          </Reanimated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  brandContainer: { alignItems: 'center', marginBottom: 36 },
  iconOuterGlow: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  brandTitle: { fontSize: 28, fontWeight: 'bold', letterSpacing: -0.3 },
  brandSubtitle: { fontSize: 16, marginTop: 6 },
  card: { padding: 28, width: '100%' },
  errorBanner: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.sm, marginBottom: 16 },
  errorText: { textAlign: 'center', fontWeight: '500', fontSize: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputWrapper: { borderWidth: 1.5, borderRadius: Radius.md, marginBottom: 20 },
  input: { padding: 16, fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
