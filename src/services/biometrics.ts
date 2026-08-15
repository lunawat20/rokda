// ROKDA BIOMETRICS & FACE ID SERVICE
// Configures native LocalAuthentication (Face ID / Touch ID / Passcode) and lock timeouts.

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type LockTimeoutSetting = 'immediately' | '1min' | '5min' | 'never';

const BIOMETRIC_ENABLED_KEY = 'rokda_biometric_enabled';
const LOCK_TIMEOUT_KEY = 'rokda_lock_timeout';
const LAST_BACKGROUND_TIME_KEY = 'rokda_last_bg_time';

export async function checkBiometricHardware(): Promise<{ hasHardware: boolean; isEnrolled: boolean; supportedTypes: LocalAuthentication.AuthenticationType[] }> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return { hasHardware, isEnrolled, supportedTypes };
}

export async function authenticateWithBiometrics(reason: string = 'Unlock Rokda'): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Enter Passcode',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function setLockTimeout(timeout: LockTimeoutSetting): Promise<void> {
  await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, timeout);
}

export async function getLockTimeout(): Promise<LockTimeoutSetting> {
  const val = await SecureStore.getItemAsync(LOCK_TIMEOUT_KEY);
  return (val as LockTimeoutSetting) || 'immediately';
}

export async function recordBackgroundTimestamp(): Promise<void> {
  await SecureStore.setItemAsync(LAST_BACKGROUND_TIME_KEY, Date.now().toString());
}

export async function shouldRequireUnlock(): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return false;

  const timeout = await getLockTimeout();
  if (timeout === 'never') return false;

  const lastBgStr = await SecureStore.getItemAsync(LAST_BACKGROUND_TIME_KEY);
  if (!lastBgStr) return true;

  const elapsedMs = Date.now() - parseInt(lastBgStr, 10);
  if (timeout === 'immediately') return true;
  if (timeout === '1min' && elapsedMs > 60 * 1000) return true;
  if (timeout === '5min' && elapsedMs > 5 * 60 * 1000) return true;

  return false;
}
