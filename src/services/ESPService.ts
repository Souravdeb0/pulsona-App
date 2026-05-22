import { Platform } from 'react-native';
import { SafeStorage } from './storage';
import { BASE_URL } from './api';

const ESP_IP_KEY = 'pulsona_esp_ip';
const ESP_TIMEOUT = 5000; // 5-second timeout for ESP32 requests

/**
 * ESPService — Handles direct WiFi communication with the ESP32-S3 device
 * and coordinates recording sessions with the backend.
 */
class ESPServiceClass {
  private espIP: string | null = null;

  /**
   * Initialize the service by loading persisted ESP IP
   */
  async init(): Promise<void> {
    try {
      const storedIP = await SafeStorage.getItem(ESP_IP_KEY);
      if (storedIP) {
        this.espIP = storedIP;
      }
    } catch (e) {
      console.warn('[ESPService] Failed to load ESP IP from storage');
    }
  }

  /**
   * Set and persist the ESP32 device IP address
   */
  async setDeviceIP(ip: string): Promise<void> {
    this.espIP = ip;
    await SafeStorage.setItem(ESP_IP_KEY, ip);
    console.log(`[ESPService] Device IP set: ${ip}`);
  }

  /**
   * Get the current ESP32 IP
   */
  getDeviceIP(): string | null {
    return this.espIP;
  }

  /**
   * Clear the stored ESP32 IP (when unpairing)
   */
  async clearDeviceIP(): Promise<void> {
    this.espIP = null;
    await SafeStorage.deleteItem(ESP_IP_KEY);
  }

  /**
   * Check if the ESP32 is reachable and get its status
   */
  async getStatus(): Promise<{ state: 'idle' | 'recording' | 'error'; message?: string }> {
    if (!this.espIP) {
      return { state: 'error', message: 'No ESP32 IP configured' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ESP_TIMEOUT);

      const response = await fetch(`http://${this.espIP}/status`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return { state: 'error', message: `ESP32 returned ${response.status}` };
      }

      const data = await response.json();
      return { state: data.state || 'idle' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { state: 'error', message: 'ESP32 unreachable (timeout)' };
      }
      return { state: 'error', message: `Connection failed: ${err.message}` };
    }
  }

  /**
   * Tell the ESP32 to start recording and streaming audio to the backend
   */
  async startRecording(sessionId: string, backendUrl: string): Promise<boolean> {
    if (!this.espIP) {
      console.error('[ESPService] Cannot start recording: no ESP IP');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ESP_TIMEOUT);

      // Tell the ESP32 to start capturing and POST chunks to the backend
      const response = await fetch(
        `http://${this.espIP}/start?sessionId=${sessionId}&backendUrl=${encodeURIComponent(backendUrl)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[ESPService] Start recording failed: ${response.status}`);
        return false;
      }

      console.log(`[ESPService] Recording started on ESP32 (session: ${sessionId})`);
      return true;
    } catch (err: any) {
      console.error(`[ESPService] Start recording error: ${err.message}`);
      return false;
    }
  }

  /**
   * Tell the ESP32 to stop recording
   */
  async stopRecording(): Promise<boolean> {
    if (!this.espIP) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ESP_TIMEOUT);

      const response = await fetch(`http://${this.espIP}/stop`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      console.log(`[ESPService] Stop command sent to ESP32`);
      return response.ok;
    } catch (err: any) {
      console.error(`[ESPService] Stop recording error: ${err.message}`);
      return false;
    }
  }

  /**
   * Create a recording session on the backend
   */
  async createSession(userId: string, scanType: string): Promise<string | null> {
    try {
      const response = await fetch(`${BASE_URL}/device/start-recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, scanType }),
      });

      if (!response.ok) {
        console.error(`[ESPService] Backend session creation failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[ESPService] Backend session created: ${data.sessionId}`);
      return data.sessionId;
    } catch (err: any) {
      console.error(`[ESPService] Session creation error: ${err.message}`);
      return null;
    }
  }

  /**
   * Notify the backend that streaming has ended
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/device/stream-end/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error(`[ESPService] End session failed: ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log(`[ESPService] Session ended: ${data.message}`);
      return true;
    } catch (err: any) {
      console.error(`[ESPService] End session error: ${err.message}`);
      return false;
    }
  }

  /**
   * Full recording orchestration: create session → start ESP → wait → stop ESP → end session
   * This is the main method called by the scan screen.
   */
  async orchestrateRecording(
    userId: string,
    scanType: string,
    onSessionCreated?: (sessionId: string) => void
  ): Promise<string | null> {
    // 1. Create backend session
    const sessionId = await this.createSession(userId, scanType);
    if (!sessionId) return null;

    onSessionCreated?.(sessionId);

    // 2. Tell ESP32 to start recording
    const started = await this.startRecording(sessionId, BASE_URL);
    if (!started) {
      console.warn('[ESPService] ESP32 did not respond. Backend session created but hardware not streaming.');
      // Don't return null — the session was created and the scan screen can still wait for manual data
    }

    return sessionId;
  }

  /**
   * Stop recording and finalize: stop ESP → end backend session
   */
  async finalizeRecording(sessionId: string): Promise<boolean> {
    // 1. Tell ESP32 to stop
    await this.stopRecording();

    // 2. Notify backend to assemble WAV
    return await this.endSession(sessionId);
  }

  /**
   * Fetch the client's own IP address from the backend
   */
  async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch(`${BASE_URL}/device/my-ip`);
      if (response.ok) {
        const data = await response.json();
        return data.ip || null;
      }
    } catch (err) {
      console.warn('[ESPService] Failed to retrieve client IP from backend', err);
    }
    return null;
  }

  /**
   * Ping a single IP to see if it hosts the Pulsona status endpoint
   */
  async pingIP(ip: string): Promise<{ device: string; model: string; firmware: string; state: string } | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

      const res = await fetch(`http://${ip}/status`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        // Check signature
        if (data && (data.device === 'pulsona-neo' || data.state)) {
          return {
            device: data.device || 'pulsona-neo',
            model: data.model || 'Neo Sense',
            firmware: data.firmware || '1.0.0',
            state: data.state || 'idle',
          };
        }
      }
    } catch (e) {
      // Host is unreachable or doesn't have the status endpoint
    }
    return null;
  }

  /**
   * Scan local subnets and resolve mDNS hosts to find Pulsona devices.
   * @param onDeviceFound Callback when a device is found: (ip: string, deviceMeta: any) => void
   * @param onProgress Callback with progress message: (msg: string) => void
   */
  async scanNetwork(
    onDeviceFound: (ip: string, deviceMeta: { device: string; model: string; firmware: string; state: string }) => void,
    onProgress: (msg: string) => void
  ): Promise<string[]> {
    const foundDevices: string[] = [];

    // 1. Check mDNS addresses first (fast path)
    onProgress('Resolving mDNS network hosts...');
    const dnsHosts = ['pulsona.local', 'pulsona-neo.local'];
    const dnsPromises = dnsHosts.map(async (host) => {
      const meta = await this.pingIP(host);
      if (meta) {
        if (!foundDevices.includes(host)) {
          foundDevices.push(host);
          onDeviceFound(host, meta);
        }
      }
    });
    await Promise.all(dnsPromises);

    // 2. Query backend to find out the app's current local subnet
    onProgress('Detecting local IP subnet from backend...');
    const clientIP = await this.getClientIP();
    
    const subnets: string[] = [];
    if (clientIP && clientIP !== '127.0.0.1' && clientIP !== '::1') {
      const parts = clientIP.split('.');
      if (parts.length === 4) {
        const clientSubnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        subnets.push(clientSubnet);
      }
    }

    // Add common default subnets to cover common home setups
    const defaultSubnets = ['192.168.1', '192.168.0', '192.168.4'];
    for (const sub of defaultSubnets) {
      if (!subnets.includes(sub)) {
        subnets.push(sub);
      }
    }

    // 3. Scan the identified subnets in parallel batches
    for (const subnet of subnets) {
      onProgress(`Scanning subnet ${subnet}.X...`);
      
      const batchSize = 40;
      const hosts = Array.from({ length: 254 }, (_, i) => i + 1);

      for (let i = 0; i < hosts.length; i += batchSize) {
        const batch = hosts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (host) => {
          const ip = `${subnet}.${host}`;
          
          // Skip client's own IP
          if (ip === clientIP) return;

          const meta = await this.pingIP(ip);
          if (meta) {
            if (!foundDevices.includes(ip)) {
              foundDevices.push(ip);
              onDeviceFound(ip, meta);
            }
          }
        });
        
        await Promise.all(batchPromises);
      }
    }

    // 4. Fallback for testing/browser: if no devices were found in web browser preview,
    // inject a mock device after 2 seconds of scanning so the developer/user can see how the UI works.
    if (foundDevices.length === 0 && Platform.OS === 'web') {
      onProgress('Simulating search for local devices...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockIP = '192.168.1.120';
      const mockMeta = {
        device: 'pulsona-neo',
        model: 'Neo Sense',
        firmware: '1.2.0',
        state: 'idle'
      };
      foundDevices.push(mockIP);
      onDeviceFound(mockIP, mockMeta);
    }

    onProgress('Scan completed.');
    return foundDevices;
  }
}

export const ESPService = new ESPServiceClass();
