// SUPABASE CLIENT INITIALIZATION & SECURE STORE ADAPTER

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://duzwvmpbznspgixlhajp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_P-vBDd4VQHgwf7FPDkZpDQ_Gj5ZR-XE';

// Universal SecureStore / LocalStorage adapter for Supabase auth token persistence
const UniversalStorageAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
