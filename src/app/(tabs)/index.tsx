import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Typography, Spacing, Gradients } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PulsonaAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useDevice, getDeviceScans } from '@/context/DeviceContext';
import { MeshBackground } from '@/components/MeshBackground';
import Reanimated, { 
  FadeInDown, 
  FadeInRight, 
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { ProgressRing } from '@/components/ProgressRing';
import { HapticsService } from '@/services/HapticsService';
import { DashboardSkeleton } from '@/components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScanItem = {
  id: string;
  type: string;
  classification: string;
  confidence: string;
  date: string;
};

export default function HomeScreen({ navigation }: any) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { user } = useAuth();
  const { pairedDevice, isConnected } = useDevice();
  const [recentScans, setRecentScans] = useState<ScanItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scanOptions = pairedDevice ? getDeviceScans(pairedDevice) : [];

  const loadRecent = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const scans = await PulsonaAPI.getScanHistory();
      setRecentScans(scans.slice(0, 3));
    } catch (e) {
      // Silently handle
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
    if (navigation && typeof navigation.addListener === 'function') {
      const unsubscribe = navigation.addListener('focus', () => {
        loadRecent();
      });
      return unsubscribe;
    }
  }, [navigation, loadRecent]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', period: 'morning' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', period: 'afternoon' };
    return { text: 'Good Evening', emoji: '🌙', period: 'evening' };
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const greeting = getGreeting();
  const healthScore = pairedDevice ? 84 : 0;

  const metrics = [
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: 'heart-pulse', color: '#f43f5e', gradient: ['#f43f5e', '#e11d48'] },
    { label: 'SpO₂', value: '98', unit: '%', icon: 'water-outline', color: colors.primary, gradient: Gradients.primary },
    { label: 'Sleep', value: '8.2', unit: 'hrs', icon: 'moon-waning-crescent', color: '#a855f7', gradient: Gradients.purple },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <MeshBackground style={styles.container}>
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecent(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <SafeAreaView edges={['top']}>
          {/* ─── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                  {greeting.emoji} {greeting.text}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Health Overview</Text>
              </View>
              <Pressable 
                style={({ pressed }) => [
                  styles.headerAction, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.glassBorder,
                    opacity: pressed ? 0.7 : 1,
                  }
                ]}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <View style={[styles.badge, { backgroundColor: '#f43f5e' }]} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* ─── Hero Health Score Card ─────────────────────── */}
        <View style={styles.heroSection}>
          <Reanimated.View entering={FadeInDown.duration(700).delay(100)}>
            <Card glass blurIntensity={20} style={styles.heroCard}>
              {/* Subtle gradient accent at top */}
              <LinearGradient
                colors={[colors.primary + '25', 'transparent']}
                style={styles.heroCardAccent}
              />
              <View style={styles.heroContent}>
                <Reanimated.View entering={ZoomIn.duration(800).delay(300)} style={styles.progressContainer}>
                  <ProgressRing 
                    progress={healthScore / 100} 
                    size={150} 
                    strokeWidth={14} 
                    color={colors.primary} 
                    backgroundColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                    label={`${healthScore}`}
                    subLabel="Health Score"
                  />
                </Reanimated.View>
                
                <View style={styles.heroRight}>
                  <View style={styles.heroStatusRow}>
                    <View style={[styles.heroStatusDot, { backgroundColor: pairedDevice ? colors.success : colors.warning }]} />
                    <Text style={[styles.heroStatusText, { color: colors.textSecondary }]}>
                      {pairedDevice ? 'Device Active' : 'No Device'}
                    </Text>
                  </View>
                  <Text style={[styles.heroInsightText, { color: colors.text }]}>
                    {pairedDevice 
                      ? 'Your vitals look healthy. Keep monitoring regularly.'
                      : 'Pair a Pulsona device to start tracking your health.'}
                  </Text>
                  {pairedDevice && (
                    <View style={styles.heroChipsRow}>
                      <View style={[styles.heroChip, { backgroundColor: colors.successMuted }]}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={[styles.heroChipText, { color: colors.success }]}>Normal</Text>
                      </View>
                      <View style={[styles.heroChip, { backgroundColor: colors.primaryMuted }]}>
                        <Ionicons name="pulse" size={12} color={colors.primary} />
                        <Text style={[styles.heroChipText, { color: colors.primary }]}>Stable</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </Reanimated.View>

          {/* ─── Metric Pills ────────────────────────────── */}
          <View style={styles.metricsGrid}>
            {metrics.map((m, i) => (
              <Reanimated.View 
                key={m.label} 
                entering={FadeInUp.delay(400 + i * 120)} 
                style={styles.metricPillWrap}
              >
                <Card glass blurIntensity={12} style={styles.metricPill}>
                  <View style={[styles.metricIconCircle, { backgroundColor: m.color + '18' }]}>
                    <MaterialCommunityIcons name={m.icon as any} size={16} color={m.color} />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {m.value}
                    <Text style={[styles.metricUnit, { color: colors.textSecondary }]}> {m.unit}</Text>
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
                </Card>
              </Reanimated.View>
            ))}
          </View>
        </View>

        {/* ─── Body Content ───────────────────────────────── */}
        <View style={styles.bodyContent}>
          {/* Diagnostic Modes */}
          <View style={styles.actionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnostic Modes</Text>
            <Pressable 
              onPress={() => router.push('/(tabs)/device' as any)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[styles.manageDeviceText, { color: colors.primary }]}>Manage Device</Text>
            </Pressable>
          </View>

          {/* No Device Banner */}
          {!pairedDevice ? (
            <Reanimated.View entering={FadeInDown.duration(600).delay(400)}>
              <Card 
                glass 
                blurIntensity={25} 
                onPress={() => { HapticsService.light(); router.push('/(tabs)/device' as any); }} 
                style={styles.connectBanner}
              >
                <LinearGradient
                  colors={[colors.primary + '15', 'transparent']}
                  style={styles.connectBannerGradient}
                />
                <View style={[styles.connectIconCircle, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="wifi-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.connectInfo}>
                  <Text style={[styles.connectTitle, { color: colors.text }]}>Pair Diagnostic Device</Text>
                  <Text style={[styles.connectSubtitle, { color: colors.textSecondary }]}>
                    Connect your Pulsona Neo via Wi-Fi to begin live biometric monitoring
                  </Text>
                </View>
                <View style={[styles.connectArrow, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </Card>
            </Reanimated.View>
          ) : (
            <View style={styles.scanGrid}>
              {scanOptions.map((option, index) => (
                <Reanimated.View 
                  key={option.id} 
                  entering={FadeInDown.delay(200 + index * 100)} 
                  style={styles.scanGridItem}
                >
                  <Card 
                    glass
                    blurIntensity={18}
                    style={styles.scanCardInner} 
                    onPress={
                      isConnected ? () => {
                        HapticsService.light();
                        router.push(`/instructions?type=${option.id}` as any);
                      } : undefined
                    }
                  >
                    {/* Top accent bar */}
                    <LinearGradient
                      colors={[option.color, option.color + '60']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.scanCardAccent}
                    />
                    <View style={[styles.scanIconBox, { backgroundColor: option.color + '15' }]}>
                      <FontAwesome5 name={option.icon} size={18} color={option.color} />
                    </View>
                    <Text style={[styles.scanCardTitle, { color: colors.text }]}>{option.title}</Text>
                    <View style={styles.scanCardBottom}>
                      <View style={[styles.statusPoint, { backgroundColor: isConnected ? colors.success : colors.danger }]} />
                      <Text style={[styles.scanCardSub, { color: isConnected ? colors.success : colors.textSecondary }]}>
                        {isConnected ? 'Ready' : 'Offline'}
                      </Text>
                    </View>
                  </Card>
                </Reanimated.View>
              ))}
            </View>
          )}

          {/* ─── Quick Insight Card ────────────────────────── */}
          {pairedDevice && (
            <Reanimated.View entering={FadeInDown.delay(600)}>
              <Card glass blurIntensity={15} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={[styles.insightIconWrap, { backgroundColor: '#a855f7' + '18' }]}>
                    <Ionicons name="sparkles" size={18} color="#a855f7" />
                  </View>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>AI Insight</Text>
                </View>
                <Text style={[styles.insightBody, { color: colors.textSecondary }]}>
                  Based on your recent scans, your respiratory patterns show consistent normal readings. 
                  Consider scheduling a cardiac scan for a complete health profile.
                </Text>
                <Pressable 
                  style={({ pressed }) => [styles.insightAction, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push('/(tabs)/history' as any)}
                >
                  <Text style={[styles.insightActionText, { color: colors.primary }]}>View Full Analysis</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </Pressable>
              </Card>
            </Reanimated.View>
          )}

          {/* ─── Timeline History ─────────────────────────── */}
          <View style={styles.historySection}>
            <View style={styles.actionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Scans</Text>
              {recentScans.length > 0 && (
                <Pressable 
                  onPress={() => router.push('/(tabs)/history' as any)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={[styles.manageDeviceText, { color: colors.primary }]}>View All</Text>
                </Pressable>
              )}
            </View>

            {recentScans.length === 0 ? (
              <Card glass style={styles.emptyCard}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                  <Ionicons name="medical-outline" size={28} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No scans yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Complete your first diagnostic scan to see results here.
                </Text>
              </Card>
            ) : (
              <View style={styles.timelineContainer}>
                {recentScans.map((scan, index) => {
                  const isNormal = scan.classification === 'Normal';
                  const accent = isNormal ? colors.success : colors.danger;
                  return (
                    <Reanimated.View 
                      key={scan.id} 
                      entering={FadeInDown.delay(500 + index * 120)} 
                    >
                      <Card 
                        glass 
                        blurIntensity={10} 
                        style={styles.timelineCard} 
                        onPress={() => { 
                          HapticsService.light(); 
                          router.push({ pathname: '/results', params: { ...scan } } as any); 
                        }}
                      >
                        {/* Left color accent */}
                        <View style={[styles.timelineCardAccent, { backgroundColor: accent }]} />
                        <View style={styles.timelineCardBody}>
                          <View style={styles.timelineHeader}>
                            <View style={styles.timelineTypeRow}>
                              <View style={[styles.timelineDot, { backgroundColor: accent }]} />
                              <Text style={[styles.timelineType, { color: colors.text }]}>{scan.type}</Text>
                            </View>
                            <View style={[styles.resultBadge, { backgroundColor: accent + '15' }]}>
                              <Text style={[styles.resultValue, { color: accent }]}>{scan.classification}</Text>
                            </View>
                          </View>
                          <View style={styles.timelineFooter}>
                            <Text style={[styles.timelineTs, { color: colors.textSecondary }]}>
                              {formatDate(scan.date)}
                            </Text>
                            <Text style={[styles.timelineConfidence, { color: colors.textSecondary }]}>
                              {scan.confidence} accuracy
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Reanimated.View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1 },

  // ─── Header ───
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.one, paddingBottom: Spacing.one },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { ...Typography.caption, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  headerTitle: { ...Typography.title, fontSize: 26 },
  headerAction: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  badge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },

  // ─── Hero Section ───
  heroSection: { paddingHorizontal: Spacing.three, marginTop: Spacing.two },
  heroCard: { padding: 0, overflow: 'hidden' },
  heroCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  heroContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, paddingVertical: Spacing.four },
  progressContainer: { marginRight: Spacing.three },
  heroRight: { flex: 1 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  heroStatusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  heroStatusText: { ...Typography.captionBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroInsightText: { ...Typography.body, fontSize: 13, lineHeight: 19, marginBottom: 10, opacity: 0.85 },
  heroChipsRow: { flexDirection: 'row', gap: 8 },
  heroChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, gap: 4 },
  heroChipText: { ...Typography.pill, fontSize: 10 },

  // ─── Metrics Grid ───
  metricsGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.two, gap: 8,
  },
  metricPillWrap: { flex: 1 },
  metricPill: { padding: Spacing.two, paddingVertical: 14, alignItems: 'center' },
  metricIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  metricUnit: { ...Typography.pill, fontSize: 10, opacity: 0.6 },
  metricLabel: { ...Typography.label, fontSize: 8, marginTop: 3, opacity: 0.5 },

  // ─── Body Content ───
  bodyContent: { paddingHorizontal: Spacing.three, marginTop: Spacing.three },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  sectionTitle: { ...Typography.subtitle, fontSize: 18 },
  manageDeviceText: { ...Typography.captionBold, fontSize: 13 },

  // ─── Connect Banner ───
  connectBanner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, overflow: 'hidden' },
  connectBannerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: '100%', borderRadius: Radius.lg },
  connectIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.two },
  connectInfo: { flex: 1 },
  connectTitle: { ...Typography.bodyBold, fontSize: 15, marginBottom: 2 },
  connectSubtitle: { ...Typography.caption, fontSize: 12, opacity: 0.7 },
  connectArrow: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // ─── Scan Grid ───
  scanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scanGridItem: { width: (SCREEN_WIDTH - Spacing.three * 2 - 10) / 2 },
  scanCardInner: { padding: Spacing.three, paddingTop: Spacing.four, alignItems: 'flex-start', overflow: 'hidden' },
  scanCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  scanIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  scanCardTitle: { ...Typography.bodyBold, fontSize: 14, marginBottom: 6 },
  scanCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scanCardSub: { ...Typography.caption, fontSize: 11 },
  statusPoint: { width: 6, height: 6, borderRadius: 3 },

  // ─── Insight Card ───
  insightCard: { padding: Spacing.three, marginTop: Spacing.three },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  insightTitle: { ...Typography.bodyBold, fontSize: 15 },
  insightBody: { ...Typography.body, fontSize: 13, lineHeight: 20, opacity: 0.8, marginBottom: 12 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightActionText: { ...Typography.captionBold, fontSize: 13 },

  // ─── Timeline ───
  historySection: { marginTop: Spacing.four },
  timelineContainer: { gap: 10 },
  timelineCard: { padding: 0, overflow: 'hidden', marginBottom: 0 },
  timelineCardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg },
  timelineCardBody: { paddingVertical: 14, paddingHorizontal: Spacing.three, paddingLeft: Spacing.three + 4 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  timelineTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineType: { ...Typography.bodyBold, fontSize: 14 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  resultValue: { ...Typography.pill, fontSize: 10, textTransform: 'uppercase' },
  timelineFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineTs: { ...Typography.caption, fontSize: 12, opacity: 0.6 },
  timelineConfidence: { ...Typography.caption, fontSize: 11, opacity: 0.5 },

  // ─── Empty State ───
  emptyCard: { padding: Spacing.five, alignItems: 'center', justifyContent: 'center' },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { ...Typography.bodyBold, fontSize: 15, marginBottom: 4 },
  emptySubtitle: { ...Typography.caption, textAlign: 'center', opacity: 0.6 },
});
