import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { Colors, Radius, Gradients, Shadows, Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { PulsonaAPI } from '@/services/api';
import Reanimated, { 
  FadeInDown, 
  FadeInRight,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '@/services/HapticsService';
import { ProfileSkeleton } from '@/components/Skeleton';
import { MeshBackground } from '@/components/MeshBackground';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SMOKING_STATUSES = ['Never', 'Former', 'Current'];

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PulsonaAPI.getProfile();
      setProfile(data);
      setEditData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load profile. Please check your connection.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = await PulsonaAPI.updateProfile(editData);
      setProfile(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const onConfirm = () => logout();
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) onConfirm();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', onPress: onConfirm, style: 'destructive' }
        ]
      );
    }
  };

  const statCards = [
    { icon: 'calendar-alt', label: 'Age', value: profile?.age ? `${profile.age} yrs` : '--', color: colors.primary, comp: FontAwesome5 },
    { icon: 'venus-mars', label: 'Gender', value: profile?.gender || '--', color: '#a855f7', comp: FontAwesome5 },
    { icon: 'ruler-vertical', label: 'Height', value: profile?.height ? `${profile.height} cm` : '--', color: '#14b8a6', comp: FontAwesome5 },
    { icon: 'weight', label: 'Weight', value: profile?.weight ? `${profile.weight} kg` : '--', color: '#f97316', comp: FontAwesome5 },
    { icon: 'tint', label: 'Blood', value: profile?.bloodType || '--', color: colors.danger, comp: FontAwesome5 },
    { icon: 'smoking', label: 'Smoking', value: profile?.smokingStatus || '--', color: '#eab308', comp: FontAwesome5 },
  ];

  const renderSettingsItem = (
    icon: string, label: string, 
    value?: boolean, onToggle?: (v: boolean) => void, 
    onPress?: () => void, isDanger: boolean = false,
    isLast: boolean = false
  ) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        { opacity: pressed ? 0.7 : 1 },
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
      ]}
      onPress={() => {
        if (onPress) {
          HapticsService.light();
          onPress();
        }
      }}
    >
      <View style={[styles.settingsIconWrap, { backgroundColor: isDanger ? colors.dangerMuted : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
        <Ionicons name={icon as any} size={18} color={isDanger ? colors.danger : colors.text} />
      </View>
      <Text style={[styles.settingsLabel, { color: isDanger ? colors.danger : colors.text }]}>{label}</Text>
      {onToggle ? (
        <Switch
          value={value}
          onValueChange={(v) => {
            HapticsService.selection();
            onToggle(v);
          }}
          trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={isDanger ? colors.danger : colors.textSecondary} />
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <MeshBackground style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
          </View>
          <View style={styles.scrollContent}>
            <ProfileSkeleton />
          </View>
        </SafeAreaView>
      </MeshBackground>
    );
  }

  if (error) {
    return (
      <MeshBackground style={[styles.container, styles.center]}>
        <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Connection Error</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <AppButton label="Retry Connection" onPress={loadProfile} style={{ marginTop: 24, width: '100%' }} />
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* ─── Profile Header Card ──────────────────── */}
          <Reanimated.View entering={FadeInDown.duration(600)}>
            <Card glass blurIntensity={20} style={styles.profileCard}>
              <LinearGradient
                colors={[colors.primary + '20', 'transparent']}
                style={styles.profileCardGradient}
              />
              <View style={styles.avatarSection}>
                <View style={styles.avatarRing}>
                  <LinearGradient
                    colors={Gradients.primary}
                    style={styles.avatarGradientRing}
                  />
                  <View style={[styles.avatarInner, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {user?.name?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  </View>
                </View>
                <View style={styles.profileHeaderInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Pulsona User'}</Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
                  <View style={[styles.proBadge, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                    <Text style={[styles.proBadgeText, { color: colors.primary }]}>Verified</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.editProfileBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Edit Profile</Text>
              </Pressable>
            </Card>
          </Reanimated.View>

          {/* ─── Health Stat Cards Grid ─────────────────── */}
          <Reanimated.View entering={FadeInDown.duration(600).delay(150)}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Health Metrics</Text>
            <View style={styles.statsGrid}>
              {statCards.map((stat, i) => (
                <Reanimated.View key={stat.label} entering={FadeInDown.delay(200 + i * 60)} style={styles.statCardWrap}>
                  <Card glass blurIntensity={10} style={styles.statCard}>
                    <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                      <stat.comp name={stat.icon} size={14} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  </Card>
                </Reanimated.View>
              ))}
            </View>
          </Reanimated.View>

          {/* ─── Settings: Application ────────────────── */}
          <Reanimated.View entering={FadeInRight.delay(300).duration(600)}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Application</Text>
            <Card glass blurIntensity={10} style={styles.settingsGroup}>
              {renderSettingsItem('moon-outline', 'Dark Mode', isDark, toggleTheme)}
              {renderSettingsItem('notifications-outline', 'Push Notifications', notifications, setNotifications)}
              {renderSettingsItem('finger-print-outline', 'Screen Lock', biometrics, setBiometrics, undefined, false, true)}
            </Card>
          </Reanimated.View>

          {/* ─── Settings: Support ────────────────────── */}
          <Reanimated.View entering={FadeInRight.delay(450).duration(600)}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Support & Legal</Text>
            <Card glass blurIntensity={10} style={styles.settingsGroup}>
              {renderSettingsItem('help-circle-outline', 'Help Center')}
              {renderSettingsItem('document-text-outline', 'Terms of Service')}
              {renderSettingsItem('shield-checkmark-outline', 'Privacy Policy', undefined, undefined, undefined, false, true)}
            </Card>
          </Reanimated.View>

          {/* ─── Sign Out ─────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(600)}>
            <Pressable 
              style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.85 : 1 }]} 
              onPress={handleLogout}
            >
              <LinearGradient 
                colors={Gradients.danger as any} 
                style={styles.logoutGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </LinearGradient>
            </Pressable>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>Pulsona v1.0.42 — Production Build</Text>
          </Reanimated.View>
        </ScrollView>

        {/* ─── Edit Profile Modal ─────────────────────── */}
        <Modal visible={isEditing} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Update Profile</Text>
                <Pressable 
                  onPress={() => setIsEditing(false)}
                  style={({ pressed }) => [styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Age</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    value={(editData.age ?? '').toString()}
                    onChangeText={(v) => setEditData({...editData, age: parseInt(v) || 0})}
                    keyboardType="numeric"
                    placeholder="32"
                    placeholderTextColor={colors.textSecondary + '60'}
                  />

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
                  <View style={styles.rowGrid}>
                    {GENDERS.map(g => (
                      <Pressable
                        key={g}
                        style={[
                          styles.chip, 
                          { 
                            backgroundColor: editData.gender === g ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            borderWidth: editData.gender === g ? 0 : 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          }
                        ]}
                        onPress={() => setEditData({...editData, gender: g})}
                      >
                        <Text style={{ color: editData.gender === g ? '#fff' : colors.text, fontWeight: '600', fontSize: 14 }}>{g}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
                    value={(editData.weight ?? '').toString()}
                    onChangeText={(v) => setEditData({...editData, weight: parseFloat(v) || 0})}
                    keyboardType="decimal-pad"
                    placeholder="70"
                    placeholderTextColor={colors.textSecondary + '60'}
                  />

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Smoking Status</Text>
                  <View style={styles.rowGrid}>
                    {SMOKING_STATUSES.map(s => (
                      <Pressable
                        key={s}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: editData.smokingStatus === s ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            borderWidth: editData.smokingStatus === s ? 0 : 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          }
                        ]}
                        onPress={() => setEditData({...editData, smokingStatus: s})}
                      >
                        <Text style={{ color: editData.smokingStatus === s ? '#fff' : colors.text, fontWeight: '600', fontSize: 14 }}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <AppButton
                  label={saving ? '' : 'Save Changes'}
                  onPress={handleUpdate}
                  disabled={saving}
                />
                {saving && <ActivityIndicator color="#fff" style={{ position: 'absolute', alignSelf: 'center', top: 18 }} />}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.one },
  title: { ...Typography.title, fontSize: 26 },
  errorTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 21, opacity: 0.7 },
  scrollContent: { flex: 1, paddingHorizontal: Spacing.three },

  // ─── Profile Card ───
  profileCard: { padding: Spacing.four, overflow: 'hidden' },
  profileCardGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  avatarSection: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three },
  avatarRing: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarGradientRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36 },
  avatarInner: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800' },
  profileHeaderInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, opacity: 0.6, marginTop: 2 },
  proBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 6, gap: 4 },
  proBadgeText: { ...Typography.pill, fontSize: 10 },
  editProfileBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 12, borderRadius: Radius.md, gap: 6 
  },
  editProfileBtnText: { ...Typography.captionBold, fontSize: 14 },

  // ─── Health Stats Grid ───
  groupTitle: { ...Typography.label, fontSize: 11, marginTop: 24, marginBottom: 10, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCardWrap: { width: '31%', flexGrow: 1 },
  statCard: { padding: 14, alignItems: 'center' },
  statIconBg: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { ...Typography.label, fontSize: 8, marginTop: 3, opacity: 0.5 },

  // ─── Settings ───
  settingsGroup: { padding: 0, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingsIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  // ─── Logout ───
  logoutBtn: { marginTop: 28, height: 50, borderRadius: Radius.xxl, overflow: 'hidden' },
  logoutGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 14, opacity: 0.4 },

  // ─── Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { flex: 1, paddingHorizontal: 24 },
  inputGroup: { paddingBottom: 40 },
  inputLabel: { ...Typography.label, fontSize: 11, marginTop: 20, marginBottom: 8 },
  input: { padding: 14, borderRadius: Radius.md, borderWidth: 1, fontSize: 16, fontWeight: '500' },
  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: Radius.full },
  modalFooter: { padding: 24, paddingBottom: 40 },
});
