import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEOUT_MS = 1000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T, key: string, op: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        console.log(`[SafeStorage] ${op} timed out after ${timeoutMs}ms for key: ${key}. Falling back.`);
        resolve(fallback);
      }, timeoutMs);
    })
  ]);
};

/**
 * Platform-safe storage wrapper.
 * Uses SecureStore with timeout on native platforms, falls back to AsyncStorage.
 * Uses localStorage on Web.
 */
export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    
    try {
      const securePromise = SecureStore.getItemAsync(key);
      const result = await withTimeout(securePromise, TIMEOUT_MS, 'TIMEOUT_FALLBACK', key, 'getItem');
      
      if (result !== 'TIMEOUT_FALLBACK') {
        return result;
      }
    } catch (e) {
      console.log(`[SafeStorage] SecureStore.getItemAsync error for key: ${key}, falling back to AsyncStorage`, e);
    }
    
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.error(`[SafeStorage] AsyncStorage.getItem failed for key: ${key}`, err);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail on web
      }
      return;
    }

    try {
      const securePromise = SecureStore.setItemAsync(key, value).then(() => 'SUCCESS' as const);
      const result = await withTimeout(securePromise, TIMEOUT_MS, 'TIMEOUT_FALLBACK' as const, key, 'setItem');
      
      if (result !== 'TIMEOUT_FALLBACK') {
        try {
          await AsyncStorage.setItem(key, value);
        } catch {
          // Ignore mirror error
        }
        return;
      }
    } catch (e) {
      console.log(`[SafeStorage] SecureStore.setItemAsync error for key: ${key}, falling back to AsyncStorage`, e);
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.error(`[SafeStorage] AsyncStorage.setItem failed for key: ${key}`, err);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail
      }
      return;
    }

    try {
      const securePromise = SecureStore.deleteItemAsync(key).then(() => 'SUCCESS' as const);
      const result = await withTimeout(securePromise, TIMEOUT_MS, 'TIMEOUT_FALLBACK' as const, key, 'deleteItem');
      
      if (result !== 'TIMEOUT_FALLBACK') {
        try {
          await AsyncStorage.removeItem(key);
        } catch {
          // Ignore mirror error
        }
        return;
      }
    } catch (e) {
      console.log(`[SafeStorage] SecureStore.deleteItemAsync error for key: ${key}, falling back to AsyncStorage`, e);
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error(`[SafeStorage] AsyncStorage.removeItem failed for key: ${key}`, err);
    }
  },
};

