import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Colors, Radius, Gradients, Shadows, Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevice, getDeviceScans } from '@/context/DeviceContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MeshBackground } from '@/components/MeshBackground';
import Reanimated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

// Pulsing animation component for the empty state
function PulsingCircle({ size, color, delay }: { size: number; color: string; delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulsingCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

export default function DeviceScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { pairedDevice, isConnected, toggleConnection, unpairDevice, espIP } = useDevice();

  // --- No Device Paired State ---
  if (!pairedDevice) {
    return (
      <MeshBackground style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>My Device</Text>
          </View>

          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <PulsingCircle size={140} color={colors.primary} delay={0} />
              <PulsingCircle size={140} color={colors.primary} delay={1000} />
              <PulsingCircle size={140} color={colors.primary} delay={2000} />
              <LinearGradient
                colors={[colors.primary + '40', colors.background]}
                style={styles.emptyIconCircle}
              >
                <Ionicons name="wifi-outline" size={64} color={colors.primary} />
              </LinearGradient>
            </View>
            
            <Reanimated.View entering={FadeInDown.duration(600).delay(200)}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Device Paired</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Connect a Pulsona Health Monitor to start capturing high-fidelity biometric data.
              </Text>
            </Reanimated.View>

            <Reanimated.View entering={FadeInDown.duration(600).delay(400)}>
              <AppButton
                label="Pair Device"
                onPress={() => router.push('/add-device' as any)}
                icon="add-circle-outline"
                size="lg"
                style={{ width: 220 }}
              />
            </Reanimated.View>
          </View>
        </SafeAreaView>
      </MeshBackground>
    );
  }

  // --- Device Paired State ---
  const deviceScans = getDeviceScans(pairedDevice);

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Device</Text>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Reanimated.View entering={ZoomIn.duration(600)}>
            <Card glass blurIntensity={15} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <LinearGradient
                  colors={isConnected ? [pairedDevice.color + '40', pairedDevice.color + '10'] : [colors.backgroundSelected, colors.backgroundSelected]}
                  style={styles.deviceIconWrapper}
                >
                  <FontAwesome5
                    name={pairedDevice.icon}
                    size={28}
                    color={isConnected ? pairedDevice.color : colors.textSecondary}
                  />
                </LinearGradient>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: colors.text }]}>{pairedDevice.name}</Text>
                  <Text style={[styles.deviceModel, { color: colors.textSecondary }]}>{pairedDevice.model}</Text>
                  <View style={styles.statusRow}>
                    <StatusBadge
                      status={isConnected ? 'connected' : 'disconnected'}
                      size="sm"
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

              <View style={styles.deviceDetails}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="battery-charging" size={18} color={colors.success} />
                  </View>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>Battery</Text>
                  <View style={styles.batteryContainer}>
                    <View style={[styles.batteryTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <LinearGradient
                        colors={[colors.success + '80', colors.success]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.batteryFill, { width: '78%' }]}
                      />
                    </View>
                    <Text style={[styles.detailValue, { color: colors.text, marginLeft: Spacing.one }]}>78%</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="hardware-chip-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>Firmware</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{pairedDevice.firmware}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="wifi-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>Link Protocol</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>WiFi / WLAN</Text>
                </View>
                {espIP && (
                  <View style={styles.detailRow}>
                    <View style={[styles.detailIconWrap, { backgroundColor: '#a855f7' + '15' }]}>
                      <Ionicons name="globe-outline" size={18} color="#a855f7" />
                    </View>
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>ESP32 IP</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{espIP}</Text>
                  </View>
                )}
              </View>

              <AppButton
                label={isConnected ? 'Disconnect' : 'Connect Now'}
                onPress={toggleConnection}
                icon={isConnected ? 'wifi' : 'wifi-outline'}
                size="md"
              />
            </Card>
          </Reanimated.View>

          {/* Supported Scans */}
          <Reanimated.View entering={FadeInDown.duration(600).delay(200)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clinical Capabilities</Text>
            <View style={styles.scansGrid}>
              {deviceScans.map((scan, index) => (
                <Card key={scan.id} glass blurIntensity={5} style={styles.scanCard} onPress={() => {}}>
                  <View style={[styles.scanIconBg, { backgroundColor: scan.color + '15' }]}>
                    <FontAwesome5 name={scan.icon} size={20} color={scan.color} />
                  </View>
                  <Text style={[styles.scanCardTitle, { color: colors.text }]} numberOfLines={1}>{scan.title}</Text>
                </Card>
              ))}
            </View>
          </Reanimated.View>

          {/* Action Buttons */}
          <Reanimated.View entering={FadeInDown.duration(600).delay(400)} style={styles.actionSection}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryActionBtn,
                { backgroundColor: colors.backgroundSelected, opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={() => router.push('/add-device' as any)}
            >
              <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>Change Active Device</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.dangerActionBtn,
                { backgroundColor: colors.danger + '10', opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={unpairDevice}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.dangerActionText, { color: colors.danger }]}>Unpair Device Hardware</Text>
            </Pressable>
          </Reanimated.View>

          <View style={{ height: Spacing.eight }} />
        </ScrollView>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  title: {
    ...Typography.title,
  },
  // Empty state
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.eight,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  pulsingCircle: {
    position: 'absolute',
    borderWidth: 2,
  },
  emptyIconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyTitle: {
    ...Typography.subtitle,
    fontSize: 24,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.six,
    opacity: 0.7,
  },
  // Paired state
  scrollContent: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  deviceCard: {
    padding: Spacing.five,
    marginTop: Spacing.one,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  deviceIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...Typography.bodyBold,
    fontSize: 18,
    marginBottom: 2,
  },
  deviceModel: {
    ...Typography.caption,
    fontSize: 12,
    marginBottom: 6,
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.three,
    opacity: 0.5,
  },
  deviceDetails: {
    marginBottom: Spacing.four,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    ...Typography.body,
    fontSize: 15,
    marginLeft: Spacing.two,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyBold,
    fontSize: 15,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  batteryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  scansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scanCard: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    minWidth: '30%',
    flex: 1,
  },
  scanIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  scanCardTitle: {
    ...Typography.captionBold,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  actionSection: {
    marginTop: Spacing.two,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  secondaryActionText: {
    ...Typography.bodyBold,
    fontSize: 15,
  },
  dangerActionBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  dangerActionText: {
    ...Typography.bodyBold,
    fontSize: 15,
  },
});


