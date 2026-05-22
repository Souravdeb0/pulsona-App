import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SafeStorage } from '@/services/storage';
import { ESPService } from '@/services/ESPService';

// --- Scan Capability Definition ---
export type ScanCapability = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

// All possible scan types
export const ALL_SCAN_CAPABILITIES: ScanCapability[] = [
  { id: 'respiratory', title: 'Respiratory Sound', icon: 'lungs', color: '#14b8a6' },
  { id: 'lung', title: 'Lung Sounds', icon: 'lungs', color: '#0EA5E9' },
  { id: 'heart', title: 'Heart Sound', icon: 'heartbeat', color: '#EF4444' },
  { id: 'neck', title: 'Neck Sound', icon: 'user-md', color: '#8b5cf6' },
  { id: 'abdomen', title: 'Abdomen Sound', icon: 'stethoscope', color: '#f59e0b' },
];

// --- Device Definition ---
export type PulsonaDevice = {
  id: string;
  name: string;
  model: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  supportedScanIds: string[];
  firmware: string;
};

// --- Device Catalog ---
export const DEVICE_CATALOG: PulsonaDevice[] = [
  {
    id: 'neo-sense',
    name: 'Pulsona Neo Sense',
    model: 'PSN-NS',
    icon: 'stethoscope',
    color: '#0EA5E9',
    tagline: 'Precision WLAN Monitoring',
    description: 'Wi-Fi enabled AI stethoscope utilizing the ESP32-S3 architecture for high-fidelity respiratory analysis and clinical sound capture.',
    supportedScanIds: ['lung', 'respiratory'],
    firmware: 'v1.2.0',
  },
  {
    id: 'neo-sense-plus',
    name: 'Pulsona Neo Sense Plus',
    model: 'PSN-NS+',
    icon: 'heartbeat',
    color: '#8b5cf6',
    tagline: 'High-Fidelity Cardiac Guard',
    description: 'Advanced clinical diagnostic tool with dedicated S3-based Wi-Fi streaming for real-time cardiac auscultation and respiratory analysis.',
    supportedScanIds: ['lung', 'respiratory', 'heart'],
    firmware: 'v2.0.1',
  },
  {
    id: 'neo-sense-max',
    name: 'Pulsona Neo Sense Max',
    model: 'PSN-NSM',
    icon: 'microscope',
    color: '#f59e0b',
    tagline: 'All-Terrain Diagnostic Hub',
    description: 'Premium S3-Wi-Fi diagnostic platform with multi-channel sound capture for lungs, heart, neck, and abdominal auscultation.',
    supportedScanIds: ['lung', 'respiratory', 'heart', 'neck', 'abdomen'],
    firmware: 'v3.1.0',
  },
];

// Helper: get scan capabilities for a device
export const getDeviceScans = (device: PulsonaDevice): ScanCapability[] => {
  return ALL_SCAN_CAPABILITIES.filter(scan => device.supportedScanIds.includes(scan.id));
};

// --- Context ---
type DeviceContextType = {
  pairedDevice: PulsonaDevice | null;
  isConnected: boolean;
  isLoading: boolean;
  espIP: string | null;
  espStatus: 'idle' | 'recording' | 'disconnected';
  pairDevice: (device: PulsonaDevice, espIP?: string) => Promise<void>;
  unpairDevice: () => Promise<void>;
  toggleConnection: () => void;
  setESPIP: (ip: string) => Promise<void>;
};

const DeviceContext = createContext<DeviceContextType>({
  pairedDevice: null,
  isConnected: false,
  isLoading: true,
  espIP: null,
  espStatus: 'disconnected',
  pairDevice: async () => {},
  unpairDevice: async () => {},
  toggleConnection: () => {},
  setESPIP: async () => {},
});

export function useDevice() {
  return useContext(DeviceContext);
}

const DEVICE_KEY = 'pulsona_paired_device';

export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
  const [pairedDevice, setPairedDevice] = useState<PulsonaDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [espIP, setEspIPState] = useState<string | null>(null);
  const [espStatus, setEspStatus] = useState<'idle' | 'recording' | 'disconnected'>('disconnected');

  // Load stored device and ESP IP on startup
  useEffect(() => {
    const loadDevice = async () => {
      try {
        // Initialize ESPService (loads persisted IP)
        await ESPService.init();
        const storedIP = ESPService.getDeviceIP();
        if (storedIP) setEspIPState(storedIP);

        const stored = await SafeStorage.getItem(DEVICE_KEY);
        if (stored) {
          const deviceId = stored;
          const device = DEVICE_CATALOG.find(d => d.id === deviceId);
          if (device) {
            setPairedDevice(device);
            setIsConnected(true);
            // Check ESP status if IP is available
            if (storedIP) {
              const status = await ESPService.getStatus();
              setEspStatus(status.state === 'error' ? 'disconnected' : status.state);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load paired device', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDevice();
  }, []);

  const setESPIP = useCallback(async (ip: string) => {
    await ESPService.setDeviceIP(ip);
    setEspIPState(ip);
    // Verify connectivity
    const status = await ESPService.getStatus();
    setEspStatus(status.state === 'error' ? 'disconnected' : status.state);
  }, []);

  const pairDevice = useCallback(async (device: PulsonaDevice, deviceESPIP?: string) => {
    setPairedDevice(device);
    setIsConnected(true);
    await SafeStorage.setItem(DEVICE_KEY, device.id);
    if (deviceESPIP) {
      await setESPIP(deviceESPIP);
    }
  }, [setESPIP]);

  const unpairDevice = useCallback(async () => {
    setPairedDevice(null);
    setIsConnected(false);
    setEspIPState(null);
    setEspStatus('disconnected');
    await SafeStorage.deleteItem(DEVICE_KEY);
    await ESPService.clearDeviceIP();
  }, []);

  const toggleConnection = useCallback(() => {
    if (pairedDevice) {
      setIsConnected(prev => !prev);
    }
  }, [pairedDevice]);

  return (
    <DeviceContext.Provider value={{
      pairedDevice, isConnected, isLoading,
      espIP, espStatus,
      pairDevice, unpairDevice, toggleConnection, setESPIP
    }}>
      {children}
    </DeviceContext.Provider>
  );
};
