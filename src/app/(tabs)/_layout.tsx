import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors, Gradients } from '@/constants/theme';
import { View, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '@/services/HapticsService';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing as ReEasing,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText as Text } from '@/components/AppText';
import { useDevice, getDeviceScans } from '@/context/DeviceContext';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = 24;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);

// ─── Main Tab Bar ────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { pairedDevice } = useDevice();
  const router = useRouter();
  
  const scanOptions = pairedDevice ? getDeviceScans(pairedDevice) : [];
  const [isScanOpen, setIsScanOpen] = React.useState(false);
  const scanAnim = useSharedValue(0);

  const toggleScan = () => {
    const next = !isScanOpen;
    setIsScanOpen(next);
    scanAnim.value = withSpring(next ? 1 : 0, { damping: 16, stiffness: 140 });
    HapticsService.light();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanAnim.value, [0, 1], [0, 1]),
  }));

  const centerIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(scanAnim.value, [0, 1], [0, 135])}deg` },
      { scale: interpolate(scanAnim.value, [0, 1], [1, 1.08]) },
    ],
  }));

  const bottomPos = Platform.OS === 'ios' ? insets.bottom + 8 : 18;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Overlay */}
      {isScanOpen && (
        <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }, overlayStyle]}>
          <Pressable style={{ flex: 1 }} onPress={toggleScan} />
        </Reanimated.View>
      )}

      {/* Fan-out Scan Actions */}
      <View style={[styles.fanContainer, { bottom: bottomPos + 80 }]} pointerEvents="box-none">
        {scanOptions.map((opt, i) => (
          <FanItem
            key={opt.id}
            option={opt}
            index={i}
            total={scanOptions.length}
            animation={scanAnim}
            isDark={isDark}
            onPress={() => { toggleScan(); router.push(`/instructions?type=${opt.id}` as any); }}
          />
        ))}
      </View>

      {/* Tab Bar */}
      <View style={[styles.bar, { bottom: bottomPos, borderColor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        {/* Frosted glass background */}
        <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 35, overflow: 'hidden' }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.65)', borderRadius: 35 }]} />

        {/* Left Tabs */}
        {state.routes.slice(0, 2).map((route, i) => (
          <TabSlot key={route.key} route={route} index={i} state={state} descriptors={descriptors} navigation={navigation} colors={colors} />
        ))}

        {/* Center Action */}
        <View style={styles.centerSlot}>
          <Pressable onPress={toggleScan} style={[styles.centerBtn, { backgroundColor: isScanOpen ? colors.danger : colors.primary }]}>
            <Reanimated.View style={centerIconStyle}>
              <Ionicons name={isScanOpen ? 'close' : 'add'} size={28} color="#fff" />
            </Reanimated.View>
          </Pressable>
          <Text style={[styles.centerLabel, { color: colors.textSecondary }]}>Scan</Text>
        </View>

        {/* Right Tabs */}
        {state.routes.slice(2, 4).map((route, i) => (
          <TabSlot key={route.key} route={route} index={i + 2} state={state} descriptors={descriptors} navigation={navigation} colors={colors} />
        ))}
      </View>
    </View>
  );
}

// ─── Tab Slot ────────────────────────────────────────────────────
function TabSlot({ route, index, state, descriptors, navigation, colors }: any) {
  const { options } = descriptors[route.key];
  const label = options.title ?? route.name;
  const focused = state.index === index;

  return (
    <Pressable
      onPress={() => {
        if (!focused) { HapticsService.selection(); navigation.navigate(route.name); }
      }}
      style={styles.slot}
    >
      {options.tabBarIcon?.({ focused, color: focused ? colors.primary : colors.textSecondary, size: 22 })}
      <Text style={[styles.slotLabel, { color: focused ? colors.primary : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Fan-out Scan Item ────────────────────────────────────────────
function FanItem({ option, index, total, animation, onPress, isDark }: any) {
  // Staggered arc: fan items out in a vertical stack with slight horizontal offset
  const stagger = 0.08 * index;

  const style = useAnimatedStyle(() => {
    const progress = interpolate(animation.value, [stagger, stagger + 0.6], [0, 1], Extrapolate.CLAMP);
    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [40, -72 * (index + 1)]) },
        { scale: interpolate(progress, [0, 1], [0.4, 1], Extrapolate.CLAMP) },
      ],
    };
  });

  return (
    <Reanimated.View style={[styles.fanItemWrap, style]}>
      <View style={styles.fanLabelSide}>
        <View style={[styles.fanLabel, { backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.97)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <Text style={[styles.fanLabelText, { color: isDark ? '#ffffff' : '#1d1d1f' }]}>{option.title}</Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fanBtn, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        <FontAwesome5 name={option.icon} size={16} color={isDark ? '#2997ff' : '#0071e3'} />
      </Pressable>
    </Reanimated.View>
  );
}

// ─── Animated Icon ───────────────────────────────────────────────
function AnimIcon({ name, color, focused }: { name: string; color: any; focused: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = focused
      ? withSequence(withSpring(1.18, { damping: 10 }), withSpring(1.05, { damping: 14 }))
      : withTiming(1, { duration: 200 });
  }, [focused]);

  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Reanimated.View style={a}><Ionicons name={name as any} size={22} color={color} /></Reanimated.View>;
}

// ─── Tab Layout ──────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs tabBar={(props: any) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: (p) => <AnimIcon name={p.focused ? 'grid' : 'grid-outline'} {...p} /> }} />
      <Tabs.Screen name="device" options={{ title: 'Device', tabBarIcon: (p) => <AnimIcon name={p.focused ? 'wifi' : 'wifi-outline'} {...p} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Records', tabBarIcon: (p) => <AnimIcon name={p.focused ? 'time' : 'time-outline'} {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: (p) => <AnimIcon name={p.focused ? 'person' : 'person-outline'} {...p} /> }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
  },
  bar: {
    position: 'absolute',
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  // Tab slots
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 5,
  },
  slotLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  // Center button
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 20,
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -24,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  // Fan menu
  fanContainer: {
    position: 'absolute', left: 0, right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fanItemWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
  },
  fanLabelSide: {
    position: 'absolute',
    right: 154,
    alignItems: 'flex-end',
  },
  fanLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  fanLabelText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  fanBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    // Apple soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
  },
});
