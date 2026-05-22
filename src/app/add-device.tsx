import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppText as Text } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Colors, Radius, Gradients, Shadows, Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/Card';
import { AppButton } from '@/components/AppButton';
import { DEVICE_CATALOG, PulsonaDevice } from '@/context/DeviceContext';
import { useDevice } from '@/context/DeviceContext';
import { HapticsService } from '@/services/HapticsService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MeshBackground } from '@/components/MeshBackground';
import { PulseRing } from '@/components/PulseRing';
import { ESPService } from '@/services/ESPService';
import Reanimated, { 
  FadeInDown, 
  ZoomIn, 
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Searching animation with multiple pulsing rings ---
function SearchingRings({ color }: { color: string }) {
  return (
    <View style={styles.searchingRingsCont}>
      <PulseRing color={color} size={160} delay={0} duration={3000} />
      <PulseRing color={color} size={160} delay={1000} duration={3000} />
      <PulseRing color={color} size={160} delay={2000} duration={3000} />
      <LinearGradient colors={[color + '80', color]} style={styles.searchCenter}>
        <Ionicons name="wifi" size={38} color="#fff" />
      </LinearGradient>
    </View>
  );
}

export default function AddDeviceScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { pairDevice } = useDevice();

  const [step, setStep] = useState<'catalog' | 'scanning' | 'manual-entry' | 'success'>('catalog');
  const [selectedDevice, setSelectedDevice] = useState<PulsonaDevice | null>(null);
  const [espIPInput, setEspIPInput] = useState('');
  const [ipError, setIpError] = useState('');
  const [isValidatingIP, setIsValidatingIP] = useState(false);

  // Scanning states
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ ip: string; model: string; firmware: string }>>([]);
  const [scanProgress, setScanProgress] = useState('Initializing scan...');
  const [isScanning, setIsScanning] = useState(false);

  const startPairing = (device: PulsonaDevice) => {
    setSelectedDevice(device);
    setStep('scanning');
    setDiscoveredDevices([]);
    setScanProgress('Initializing scan...');
    setEspIPInput('');
    setIpError('');
  };

  // Run the network scanning when 'scanning' state is active
  useEffect(() => {
    let active = true;
    if (step === 'scanning' && selectedDevice) {
      setIsScanning(true);
      ESPService.scanNetwork(
        (ip, meta) => {
          if (!active) return;
          console.log(`[AddDevice] Discovered device: ${ip}`, meta);
          setDiscoveredDevices(prev => {
            if (prev.some(d => d.ip === ip)) return prev;
            return [...prev, { ip, model: meta.model, firmware: meta.firmware }];
          });
        },
        (progressMessage) => {
          if (!active) return;
          setScanProgress(progressMessage);
        }
      ).then(() => {
        if (!active) return;
        setIsScanning(false);
      }).catch(err => {
        if (!active) return;
        console.error('[AddDevice] Scanning error', err);
        setScanProgress('Scan failed.');
        setIsScanning(false);
      });
    }

    return () => {
      active = false;
    };
  }, [step, selectedDevice]);

  const handleConnectDevice = async (ip: string) => {
    HapticsService.light();
    setIsValidatingIP(true);
    setIpError('');

    // Set the IP and double check status
    await ESPService.setDeviceIP(ip);
    const status = await ESPService.getStatus();
    setIsValidatingIP(false);

    if (status.state === 'error') {
      setIpError(status.message || 'Verification failed. Please try again.');
      return;
    }

    // Success! Show success page and pair
    HapticsService.success();
    setStep('success');

    setTimeout(() => {
      pairDevice(selectedDevice!, ip);
      router.replace('/(tabs)/device' as any);
    }, 2000);
  };

  const handleManualConnect = async () => {
    const ip = espIPInput.trim();
    if (!ip) {
      setIpError('Please enter the ESP32 IP address');
      return;
    }

    // Basic IPv4 validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      setIpError('Invalid IP format (e.g. 192.168.1.100)');
      return;
    }

    setIpError('');
    setIsValidatingIP(true);

    // Set the IP and try to reach the ESP32
    await ESPService.setDeviceIP(ip);
    const status = await ESPService.getStatus();
    setIsValidatingIP(false);

    if (status.state === 'error') {
      setIpError(status.message || 'Could not reach ESP32. Check the IP and ensure the device is powered on.');
      return;
    }

    HapticsService.success();
    setStep('success');

    setTimeout(() => {
      pairDevice(selectedDevice!, ip);
      router.replace('/(tabs)/device' as any);
    }, 2000);
  };

  const renderCatalog = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.duration(600)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Available Hardware</Text>
        {DEVICE_CATALOG.map((device, index) => (
          <Reanimated.View key={device.id} entering={FadeInDown.delay(200 + index * 100)}>
            <Card glass blurIntensity={15} style={styles.deviceItemCard}>
              <View style={[styles.deviceTopAccent, { backgroundColor: device.color }]} />
              <View style={styles.deviceRow}>
                <LinearGradient 
                  colors={[device.color + '30', device.color + '10']} 
                  style={styles.cardIconWrapper}
                >
                  <FontAwesome5 name={device.icon} size={28} color={device.color} />
                </LinearGradient>
                <View style={styles.deviceInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                    <View style={[styles.tag, { backgroundColor: device.color + '15' }]}>
                      <Text style={[styles.tagText, { color: device.color }]}>{device.model}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tagline, { color: colors.textSecondary }]}>{device.tagline}</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>{device.description}</Text>
                </View>
              </View>
              <AppButton
                label="Initialize Pairing"
                onPress={() => {
                   HapticsService.light();
                   startPairing(device);
                }}
                size="md"
                style={{ marginTop: Spacing.three }}
              />
            </Card>
          </Reanimated.View>
        ))}
      </Reanimated.View>
      <View style={{ height: Spacing.six }} />
    </ScrollView>
  );

  const renderScanning = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown} style={styles.searchingCont}>
        <SearchingRings color={selectedDevice?.color || colors.primary} />
        
        <Text style={[styles.stepTitle, { color: colors.text }]}>Searching for Hardware</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Scanning local networks for your {selectedDevice?.name || 'ESP32'} device...
        </Text>
        
        <View style={styles.loadingInfo}>
          {isScanning && <ActivityIndicator color={selectedDevice?.color || colors.primary} size="small" />}
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginLeft: isScanning ? 8 : 0 }]}>
            {scanProgress.toUpperCase()}
          </Text>
        </View>

        {/* Discovered Devices List */}
        <View style={styles.devicesListContainer}>
          <Text style={[styles.listTitle, { color: colors.textSecondary }]}>
            Discovered Devices ({discoveredDevices.length})
          </Text>
          {discoveredDevices.length > 0 ? (
            discoveredDevices.map((device, index) => (
              <Reanimated.View key={device.ip} entering={FadeInDown.delay(100 * index)} style={{ width: '100%' }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.discoveredDeviceCard,
                    {
                      borderColor: (selectedDevice?.color || colors.primary) + '40',
                      backgroundColor: colors.backgroundSelected,
                      opacity: pressed ? 0.8 : 1
                    }
                  ]}
                  onPress={() => handleConnectDevice(device.ip)}
                >
                  <View style={styles.discoveredInfo}>
                    <Ionicons name="radio" size={24} color={selectedDevice?.color || colors.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.discoveredName, { color: colors.text }]}>
                        {device.model} ({device.firmware})
                      </Text>
                      <Text style={[styles.discoveredIp, { color: colors.textSecondary }]}>
                        IP Address: {device.ip}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.connectBadge, { backgroundColor: (selectedDevice?.color || colors.primary) + '15' }]}>
                    <Text style={[styles.connectBadgeText, { color: selectedDevice?.color || colors.primary }]}>
                      Connect
                    </Text>
                  </View>
                </Pressable>
              </Reanimated.View>
            ))
          ) : (
            <View style={[
              styles.emptyContainer,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            ]}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isScanning 
                  ? 'Analyzing local subnets...' 
                  : 'No devices found. Make sure your device is powered on, connected to WiFi, and on the same subnet.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtonContainer}>
          {!isScanning && (
            <AppButton
              label="Re-scan Network"
              onPress={() => {
                setDiscoveredDevices([]);
                setScanProgress('Starting new scan...');
                setStep('catalog');
                setTimeout(() => setStep('scanning'), 100);
              }}
              icon="refresh"
              size="md"
              style={{ marginBottom: 12 }}
            />
          )}

          <AppButton
            label="Pair Manually via IP"
            onPress={() => {
              setIpError('');
              setStep('manual-entry');
            }}
            icon="options-outline"
            size="md"
            variant="glass"
            style={{ marginBottom: 12 }}
          />

          <Pressable onPress={() => setStep('catalog')} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.danger }]}>Abort Pairing</Text>
          </Pressable>
        </View>
      </Reanimated.View>
    </ScrollView>
  );

  const renderSuccess = () => (
    <Reanimated.View entering={ZoomIn} style={styles.successCont}>
      <Card glass blurIntensity={20} style={styles.successCard}>
        <View style={styles.successIconWrapper}>
          <LinearGradient
            colors={Gradients.success as any}
            style={styles.successGradientRing}
          />
          <View style={[styles.successInner, { backgroundColor: isDark ? '#06131a' : '#f0fdf4' }]}>
            <Ionicons name="checkmark" size={54} color={colors.success} />
          </View>
        </View>
        <Text style={[styles.stepTitle, { color: colors.text, marginTop: Spacing.four }]}>Pairing Complete</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Biometric link established. {selectedDevice?.name} is now calibrated for clinical capture.
        </Text>
      </Card>
    </Reanimated.View>
  );

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.backgroundSelected, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Sync New Hardware</Text>
          <View style={{ width: 44 }} />
        </View>

        {step === 'catalog' && renderCatalog()}
        {step === 'scanning' && renderScanning()}
        {step === 'manual-entry' && (
          <View style={styles.searchingCont}>
            <Reanimated.View entering={FadeInDown}>
              <View style={[styles.ipEntryIconWrapper, { backgroundColor: selectedDevice?.color + '15' }]}>
                <Ionicons name="wifi" size={42} color={selectedDevice?.color || colors.primary} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Manual IP Connection</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Enter the local WiFi IP address of your {selectedDevice?.name || 'ESP32'} device.
              </Text>
              <Card glass blurIntensity={15} style={styles.ipCard}>
                <TextInput
                  style={[styles.ipInput, { color: colors.text }]}
                  placeholder="192.168.1.100"
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={espIPInput}
                  onChangeText={(text) => {
                    setEspIPInput(text);
                    if (ipError) setIpError('');
                  }}
                  keyboardType="numeric"
                  autoFocus
                />
              </Card>
              {ipError ? (
                <Text style={[styles.ipErrorText, { color: colors.danger }]}>{ipError}</Text>
              ) : null}
              <View style={styles.ipButtonRow}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setStep('scanning')}
                >
                  <Text style={[styles.cancelText, { color: colors.danger }]}>Back</Text>
                </Pressable>
                <AppButton
                  label={isValidatingIP ? 'Verifying...' : 'Connect'}
                  onPress={handleManualConnect}
                  disabled={isValidatingIP || !espIPInput.trim()}
                  icon="wifi"
                  size="md"
                  style={{ flex: 1, marginLeft: 12 }}
                />
              </View>
            </Reanimated.View>
          </View>
        )}
        {step === 'success' && renderSuccess()}
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
  headerTitle: {
    ...Typography.subtitle,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    ...Typography.label,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    opacity: 0.6,
  },
  deviceItemCard: {
    padding: Spacing.five,
    paddingTop: Spacing.six,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  deviceTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.four,
  },
  deviceInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deviceName: {
    ...Typography.bodyBold,
    fontSize: 18,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  tagText: {
    ...Typography.label,
    fontSize: 10,
  },
  tagline: {
    ...Typography.bodyBold,
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
  },
  description: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
  // Searching
  searchingCont: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.eight,
  },
  searchingRingsCont: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  searchCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...Shadows.glowStrong('#0ea5e980'),
  },
  stepTitle: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
    opacity: 0.7,
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    ...Typography.label,
    fontSize: 11,
    letterSpacing: 1,
  },
  cancelBtn: {
    marginTop: 60,
    padding: 12,
  },
  cancelText: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  // Success
  successCont: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  successCard: {
    padding: Spacing.six,
    alignItems: 'center',
    width: '100%',
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successGradientRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  successInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ipEntryIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.four,
  },
  ipCard: {
    width: '100%',
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  ipInput: {
    ...Typography.display,
    fontSize: 24,
    textAlign: 'center',
    padding: Spacing.two,
  },
  ipErrorText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  ipButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.five,
    width: '100%',
  },
  scrollContainer: {
    paddingBottom: Spacing.eight,
    width: '100%',
    alignItems: 'center',
  },
  devicesListContainer: {
    width: '100%',
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  listTitle: {
    ...Typography.label,
    fontSize: 12,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  discoveredDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.two,
    width: '100%',
  },
  discoveredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  discoveredName: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  discoveredIp: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  connectBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  connectBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    width: '100%',
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  actionButtonContainer: {
    width: '100%',
    marginTop: Spacing.three,
  },
});
