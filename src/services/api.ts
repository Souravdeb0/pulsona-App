import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SafeStorage } from './storage';
import { auth, hasFirebaseConfig, signIn, signUp, updateProfileName } from '../config/firebase';

// Handle emulator localhost differences & physical device network configurations
let localIp = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
if (hostUri) {
  const host = hostUri.split(':')[0];
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    localIp = host;
  }
}
const DEV_API_URL = `http://${localIp}:3000`;
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

// Timeout wrapper for fetch — prevents requests from hanging indefinitely
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const getHeaders = async () => {
  let token = await SafeStorage.getItem('pulsona_jwt_token');
  
  if (hasFirebaseConfig && auth && auth() && auth().currentUser) {
    try {
      const fbToken = await auth().currentUser.getIdToken(); 
      token = `Bearer ${fbToken}`;
    } catch (e) {
      console.log("Failed to retrieve Firebase ID Token, falling back to local cache");
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': token || '', 
  };
};

export const PulsonaAPI = {
  // --- AUTH PORTION ---
  login: async (email: string, password: string) => {
    try {
      if (hasFirebaseConfig && auth) {
        try {
          const userCredential = await signIn(email, password);
          const fbToken = await userCredential.user.getIdToken();
          // Return matching schema
          return { 
            token: `Bearer ${fbToken}`, 
            user: { 
              id: userCredential.user.uid, 
              name: userCredential.user.displayName || 'User', 
              email: userCredential.user.email 
            } 
          };
        } catch (fbError: any) {
          console.log("Firebase authentication login failed. Falling back to mock database authentication.", fbError);
        }
      }

      // Legacy Mock Fallback
      const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid credentials');
      }
      return res.json();
    } catch (error: any) {
      if (error.code) throw new Error(error.message); // Firebase error mapping
      if (error.name === 'AbortError') throw new Error('Connection timed out. Please check your network.');
      throw error;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    try {
      if (hasFirebaseConfig && auth) {
        try {
          const userCredential = await signUp(email, password);
          await updateProfileName(userCredential.user, name);
          const fbToken = await userCredential.user.getIdToken();
          
          // Push the identity stub to our backend so MongoDB builds the demographic document
          await fetchWithTimeout(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fbToken}` },
            body: JSON.stringify({ name, email, password })
          });
          
          return { message: 'User created securely' };
        } catch (fbError: any) {
          console.log("Firebase authentication signup failed. Falling back to mock database signup.", fbError);
        }
      }

      // Legacy Mock Fallback
      const res = await fetchWithTimeout(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }
      return res.json();
    } catch (error: any) {
      if (error.code) throw new Error(error.message);
      if (error.name === 'AbortError') throw new Error('Connection timed out. Please check your network.');
      throw error;
    }
  },


  // --- SCANS PORTION ---
  getScanHistory: async () => {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/scans`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('Failed to load scan history');
    const data = await response.json();
    return data.scans || [];
  },

  submitScan: async (type: string, classification: string, confidence: string) => {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/scans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, classification, confidence }),
    });
    if (!response.ok) throw new Error('Failed to save scan');
    return response.json();
  },

  // --- PROFILE PORTION ---
  getProfile: async () => {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/profile`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('Failed to load profile');
    const data = await response.json();
    return data.profile;
  },

  updateProfile: async (updates: { name?: string; age?: number; gender?: string; bloodType?: string; height?: number; weight?: number; smokingStatus?: string }) => {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    const data = await response.json();
    return data.profile;
  },
};
