import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, Dimensions } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { Colors, Radius, Shadows, Typography, Spacing, Gradients } from '@/constants/theme';
import { Card } from '@/components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PulsonaAPI } from '@/services/api';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { MeshBackground } from '@/components/MeshBackground';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing as ReEasing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { HistorySkeleton } from '@/components/Skeleton';

type ScanItem = {
  id: string;
  userId: string;
  type: string;
  classification: string;
  confidence: string;
  date: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CountUpNumber({ end, color, delay = 0 }: { end: number; color: string; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [end, delay]);

  return <Text style={[styles.statNumber, { color }]}>{count}</Text>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function HistoryGauge({ percentage, color, colors, isDark }: any) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const halfCircumference = circumference / 2;
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(400, withTiming(percentage / 100, { 
      duration: 1500, 
      easing: ReEasing.out(ReEasing.cubic) 
    }));
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: halfCircumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={styles.gaugeWrapper}>
       <Svg width={size} height={size/2 + 20} style={{ transform: [{ translateY: 0 }] }}>
          {/* Background Arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${halfCircumference} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(180 ${size/2} ${size/2})`}
          />
          {/* Progress Arc */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${halfCircumference} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(180 ${size/2} ${size/2})`}
            animatedProps={animatedProps}
          />
       </Svg>
    </View>
  );
}

export default function HistoryScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [data, setData] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const scans = await PulsonaAPI.getScanHistory();
      setData(scans);
    } catch (e: any) {
      setError('Failed to load scan history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    if (navigation && typeof navigation.addListener === 'function') {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchHistory();
      });
      return unsubscribe;
    }
  }, [navigation, fetchHistory]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderAnalyticsDashboard = () => {
    if (data.length === 0 && !loading) return null;

    const totalScans = data.length;
    let normalCount = 0;
    
    data.forEach(scan => {
      if (scan.classification === 'Normal') normalCount++;
    });

    const abnormalCount = totalScans - normalCount;
    const normalPercentage = totalScans > 0 ? (normalCount / totalScans) * 100 : 0;
    
    return (
      <View style={styles.dashboardContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Clinical Analytics</Text>
        
        <Card glass blurIntensity={15} style={styles.dashboardCard}>
          {totalScans > 0 && (
             <View style={styles.gaugeContainer}>
                <HistoryGauge 
                  percentage={normalPercentage} 
                  color={normalPercentage > 70 ? colors.success : colors.danger} 
                  colors={colors}
                  isDark={isDark}
                />
                <View style={styles.gaugeCenterLabel}>
                    <Text style={[styles.gaugePercentage, { color: colors.text }]}>
                      {Math.round(normalPercentage)}%
                    </Text>
                    <Text style={[styles.gaugeStatus, { color: normalPercentage > 70 ? colors.success : colors.danger }]}>
                      {normalPercentage > 70 ? 'HEALTHY' : 'NEEDS REVIEW'}
                    </Text>
                </View>
             </View>
          )}

          <View style={[styles.statsRow, { marginTop: totalScans > 0 ? Spacing.two : 0 }]}>
            <View style={styles.statBox}>
              <CountUpNumber end={totalScans} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.statBox}>
              <CountUpNumber end={normalCount} color={colors.success} delay={200} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Normal</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.statBox}>
              <CountUpNumber end={abnormalCount} color={colors.danger} delay={400} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Alerts</Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.four }]}>Medical Timeline</Text>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: ScanItem; index: number }) => {
    const isNormal = item.classification === 'Normal';
    const accentColor = isNormal ? colors.success : colors.danger;

    return (
      <Animated.View 
        entering={FadeInDown.duration(400).delay(index * 50)}
        style={styles.timelineItem}
      >
        <View style={styles.timelineLeft}>
           <View style={[styles.timelineDot, { backgroundColor: accentColor }]} />
           {index !== data.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />}
        </View>
        <View style={styles.timelineBody}>
           <Card glass blurIntensity={8} style={styles.historyCard}>
             <View style={styles.historyRow}>
               <View style={[styles.historyIconBg, { backgroundColor: accentColor + '15' }]}>
                 <FontAwesome5 
                   name={item.type.toLowerCase().includes('heart') ? 'heartbeat' : 'lungs'} 
                   size={18} 
                   color={accentColor} 
                 />
               </View>
               <View style={styles.historyInfo}>
                 <Text style={[styles.historyType, { color: colors.text }]}>{item.type}</Text>
                 <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                   {formatDate(item.date)}
                 </Text>
               </View>
               <View style={styles.historyResult}>
                 <View style={[styles.resultBadge, { backgroundColor: accentColor + '15' }]}>
                   <Text style={[styles.resultText, { color: accentColor }]}>{item.classification}</Text>
                 </View>
                 <Text style={[styles.confidence, { color: colors.textSecondary }]}>{item.confidence}</Text>
               </View>
             </View>
           </Card>
        </View>
      </Animated.View>
    );
  };

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Clinical History</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, paddingHorizontal: Spacing.three }}>
            <HistorySkeleton />
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderAnalyticsDashboard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchHistory(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              error ? (
                <View style={styles.emptyContainer}>
                  <View style={[styles.errorIconCircle, { backgroundColor: colors.dangerMuted }]}>
                    <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
                  </View>
                  <Text style={[styles.errorMsg, { color: colors.text }]}>{error}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => fetchHistory()}
                  >
                    <Text style={styles.retryText}>Retry Request</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Animated.View entering={FadeInDown.duration(800)}>
                    <View style={[styles.emptyIllustrationCloud, { backgroundColor: colors.backgroundSelected }]}>
                      <View style={styles.emptyIllustrationPulse} />
                      <FontAwesome5 name="folder-open" size={48} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Clinical Logs Empty</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Your future biometric records will appear here as a unified clinical timeline.</Text>
                  </Animated.View>
                </View>
              )
            }
          />
        )}
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
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  dashboardContainer: {
    marginBottom: Spacing.one,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.two,
  },
  dashboardCard: {
    padding: Spacing.four,
    paddingTop: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 2,
    height: 32,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.label,
    fontSize: 10,
    opacity: 0.6,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginVertical: Spacing.one,
    height: 110,
    justifyContent: 'center',
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterLabel: {
    position: 'absolute',
    bottom: -15,
    alignItems: 'center',
  },
  gaugePercentage: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  gaugeStatus: {
    ...Typography.label,
    fontSize: 11,
    marginTop: -2,
  },
  // Timeline Styles
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 24,
    zIndex: 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: Spacing.one,
  },
  historyCard: {
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    ...Typography.bodyBold,
    marginBottom: 2,
  },
  historyDate: {
    ...Typography.caption,
    opacity: 0.7,
  },
  historyResult: {
    alignItems: 'flex-end',
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  resultText: {
    ...Typography.pill,
    textTransform: 'uppercase',
  },
  confidence: {
    ...Typography.captionBold,
    fontSize: 10,
    opacity: 0.5,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustrationCloud: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  emptyIllustrationPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(14, 165, 233, 0.1)',
  },
  emptyTitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  errorIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorMsg: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: Radius.full,
  },
  retryText: {
    color: '#fff',
    ...Typography.bodyBold,
  },
});

