import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors, Radius } from '@/constants/theme';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Base Shimmer Bone ──────────────────────────────────────────
interface SkeletonBoneProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBone({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoneProps) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) },
    ],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Reanimated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(148, 163, 184, 0.06)', 'transparent']
              : ['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>
    </View>
  );
}

// ─── Skeleton Card ──────────────────────────────────────────────
export function SkeletonCard({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  return (
    <View
      style={[
        {
          borderRadius: Radius.sm,
          padding: 20,
          overflow: 'hidden',
          backgroundColor: colors.backgroundElement,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Dashboard Skeleton ─────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Header area */}
      <View style={skeletonStyles.headerArea}>
        <View style={skeletonStyles.headerTop}>
          <View>
            <SkeletonBone width={120} height={12} />
            <SkeletonBone width={180} height={24} borderRadius={6} style={{ marginTop: 8 }} />
          </View>
          <SkeletonBone width={42} height={42} borderRadius={14} />
        </View>

        {/* Progress Ring placeholder */}
        <View style={skeletonStyles.ringArea}>
          <SkeletonBone width={150} height={150} borderRadius={75} />
        </View>

        {/* Metric pills */}
        <View style={skeletonStyles.metricsRow}>
          <SkeletonBone width={'30%' as any} height={44} borderRadius={14} />
          <SkeletonBone width={'30%' as any} height={44} borderRadius={14} />
          <SkeletonBone width={'30%' as any} height={44} borderRadius={14} />
        </View>
      </View>

      {/* Body */}
      <View style={skeletonStyles.body}>
        {/* Section title */}
        <View style={skeletonStyles.sectionRow}>
          <SkeletonBone width={160} height={18} borderRadius={6} />
          <SkeletonBone width={90} height={14} borderRadius={6} />
        </View>

        {/* Scan grid */}
        <View style={skeletonStyles.scanGrid}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={skeletonStyles.scanCard}>
              <SkeletonBone width={44} height={44} borderRadius={13} />
              <SkeletonBone width={80} height={14} borderRadius={6} style={{ marginTop: 12 }} />
              <SkeletonBone width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </SkeletonCard>
          ))}
        </View>

        {/* Timeline section */}
        <SkeletonBone width={140} height={18} borderRadius={6} style={{ marginTop: 28 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={skeletonStyles.timelineRow}>
            <View style={skeletonStyles.timelineDot}>
              <SkeletonBone width={10} height={10} borderRadius={5} />
              {i < 2 && <SkeletonBone width={1.5} height={40} borderRadius={1} style={{ marginTop: 4 }} />}
            </View>
            <SkeletonCard style={skeletonStyles.timelineCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBone width={100} height={14} borderRadius={6} />
                <SkeletonBone width={60} height={20} borderRadius={6} />
              </View>
              <SkeletonBone width={180} height={10} borderRadius={4} style={{ marginTop: 8 }} />
            </SkeletonCard>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── History Skeleton ───────────────────────────────────────────
export function HistorySkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.body}>
        {/* Analytics card */}
        <SkeletonBone width={130} height={16} borderRadius={6} />
        <SkeletonCard style={{ marginTop: 12, padding: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <SkeletonBone width={160} height={80} borderRadius={12} />
          </View>
          <View style={[skeletonStyles.metricsRow, { marginTop: 20 }]}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <SkeletonBone width={36} height={28} borderRadius={6} />
              <SkeletonBone width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <SkeletonBone width={36} height={28} borderRadius={6} />
              <SkeletonBone width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <SkeletonBone width={36} height={28} borderRadius={6} />
              <SkeletonBone width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
        </SkeletonCard>

        {/* Timeline title */}
        <SkeletonBone width={140} height={16} borderRadius={6} style={{ marginTop: 28 }} />

        {/* Timeline items */}
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={skeletonStyles.timelineRow}>
            <View style={skeletonStyles.timelineDot}>
              <SkeletonBone width={10} height={10} borderRadius={5} />
              {i < 4 && <SkeletonBone width={1.5} height={36} borderRadius={1} style={{ marginTop: 4 }} />}
            </View>
            <SkeletonCard style={skeletonStyles.timelineCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonBone width={42} height={42} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <SkeletonBone width={100} height={14} borderRadius={6} />
                  <SkeletonBone width={130} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <SkeletonBone width={60} height={22} borderRadius={6} />
              </View>
            </SkeletonCard>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Profile Skeleton ───────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.body}>
        {/* Avatar row */}
        <SkeletonCard style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <SkeletonBone width={70} height={70} borderRadius={35} />
            <View style={{ marginLeft: 14 }}>
              <SkeletonBone width={140} height={18} borderRadius={6} />
              <SkeletonBone width={180} height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>

          <SkeletonBone width={'100%'} height={0.5} borderRadius={0} style={{ marginBottom: 14 }} />

          {/* Info grid */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <InfoRowSkeleton />
              <InfoRowSkeleton />
            </View>
            <View style={{ flex: 1 }}>
              <InfoRowSkeleton />
              <InfoRowSkeleton />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><InfoRowSkeleton /></View>
            <View style={{ flex: 1 }}><InfoRowSkeleton /></View>
          </View>

          <SkeletonBone width={'100%'} height={44} borderRadius={22} style={{ marginTop: 16 }} />
        </SkeletonCard>

        {/* Settings groups */}
        <SkeletonBone width={90} height={11} borderRadius={4} style={{ marginTop: 28, marginLeft: 4 }} />
        <SkeletonCard style={{ marginTop: 8, padding: 0 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14 }}>
              <SkeletonBone width={34} height={34} borderRadius={10} />
              <SkeletonBone width={120} height={14} borderRadius={6} style={{ marginLeft: 12 }} />
            </View>
          ))}
        </SkeletonCard>

        <SkeletonBone width={110} height={11} borderRadius={4} style={{ marginTop: 24, marginLeft: 4 }} />
        <SkeletonCard style={{ marginTop: 8, padding: 0 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14 }}>
              <SkeletonBone width={34} height={34} borderRadius={10} />
              <SkeletonBone width={100} height={14} borderRadius={6} style={{ marginLeft: 12 }} />
            </View>
          ))}
        </SkeletonCard>
      </View>
    </View>
  );
}

// Helper
function InfoRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <SkeletonBone width={30} height={30} borderRadius={8} />
      <View style={{ marginLeft: 10 }}>
        <SkeletonBone width={40} height={9} borderRadius={3} />
        <SkeletonBone width={55} height={12} borderRadius={4} style={{ marginTop: 3 }} />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ringArea: {
    alignItems: 'center',
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 28,
  },
  scanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scanCard: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  timelineDot: {
    width: 28,
    alignItems: 'center',
    paddingTop: 14,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 10,
    padding: 14,
  },
});
