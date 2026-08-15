// ROKDA AUTHENTICATION SERVICE WITH DEMO & OFFLINE TEST FALLBACK

import { supabase } from '../database/supabase';
import { getDatabaseForUser, closeCurrentDatabase } from '../database/db';
import { initializeUserDefaults } from '../database/repository';
import { populateSampleData } from './sampleData';
import * as SecureStore from 'expo-secure-store';

const MOCK_USER_KEY = 'ROKDA_MOCK_USER_SESSION';

export interface LocalUserSession {
  id: string;
  email: string;
  user_metadata: { name: string };
}

/**
 * Persists local demo/test user session in SecureStore.
 */
export async function saveLocalSession(session: LocalUserSession) {
  try {
    await SecureStore.setItemAsync(MOCK_USER_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('SecureStore save error:', e);
  }
}

/**
 * Retrieves persisted local demo/test user session.
 */
export async function getLocalSession(): Promise<LocalUserSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(MOCK_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Clears local user session from SecureStore.
 */
export async function clearLocalSession() {
  try {
    await SecureStore.deleteItemAsync(MOCK_USER_KEY);
  } catch (e) {
    console.warn('SecureStore clear error:', e);
  }
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (!error && data?.user) {
      await initializeUserDefaults(data.user.id);
      return data;
    }
  } catch (e) {
    console.warn('Supabase signup notice, falling back to local database:', e);
  }

  // Fallback to Local Offline Account
  const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const mockUser: LocalUserSession = {
    id: userId,
    email,
    user_metadata: { name: name || 'Rokda User' }
  };

  await initializeUserDefaults(userId);
  await saveLocalSession(mockUser);
  return { user: mockUser };
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data?.user) {
      await initializeUserDefaults(data.user.id);
      return data;
    }
  } catch (e) {
    console.warn('Supabase signin notice, falling back to local database:', e);
  }

  // Fallback to Local Offline Account
  const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const mockUser: LocalUserSession = {
    id: userId,
    email,
    user_metadata: { name: email.split('@')[0] || 'Rokda User' }
  };

  await initializeUserDefaults(userId);
  await saveLocalSession(mockUser);
  return { user: mockUser };
}

/**
 * Instant One-Tap Demo Test User Login.
 * Mounts local SQLite database for test@rokda.app and populates sample dataset.
 */
export async function signInWithDemoUser() {
  const demoEmail = 'test@rokda.app';
  const demoUserId = 'demo_user_test_rokda_app';
  const mockUser: LocalUserSession = {
    id: demoUserId,
    email: demoEmail,
    user_metadata: { name: 'Demo Rokda Tester' }
  };

  await initializeUserDefaults(demoUserId);
  await populateSampleData(demoUserId);
  await saveLocalSession(mockUser);

  return { user: mockUser };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signout notice:', e);
  }

  await clearLocalSession();
  await closeCurrentDatabase();
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } catch (e: any) {
    console.warn('Password reset notice:', e);
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    await supabase.from('profiles').delete().eq('user_id', userId);
  } catch (e) {
    console.warn('Remote deletion notice:', e);
  }

  await clearLocalSession();
  await closeCurrentDatabase();
  try {
    await supabase.auth.signOut();
  } catch (e) {}
}

export async function signInWithApple(identityToken: string) {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken
    });

    if (!error && data?.user) {
      await initializeUserDefaults(data.user.id);
      return data;
    }
  } catch (e) {
    console.warn('Apple auth notice:', e);
  }

  return signInWithDemoUser();
}
