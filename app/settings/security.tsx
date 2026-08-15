// ROKDA SECURITY & FACE ID SETTINGS SCREEN

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { isBiometricEnabled, setBiometricEnabled, getLockTimeout, setLockTimeout, LockTimeoutSetting, checkBiometricHardware } from '../../src/services/biometrics';

export default function SecuritySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [biometricEnabled, setBioEnabled] = useState(false);
  const [timeout, setTimeoutVal] = useState<LockTimeoutSetting>('immediately');

  useEffect(() => {
    isBiometricEnabled().then(setBioEnabled);
    getLockTimeout().then(setTimeoutVal);
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      const hw = await checkBiometricHardware();
      if (!hw.hasHardware || !hw.isEnrolled) {
        Alert.alert('Face ID Unavailable', 'Biometric hardware is not enrolled or available on this device.');
        return;
      }
    }
    await setBiometricEnabled(val);
    setBioEnabled(val);
  };

  const handleSelectTimeout = async (t: LockTimeoutSetting) => {
    await setLockTimeout(t);
    setTimeoutVal(t);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Security & Face ID</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Require Face ID / Biometrics</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Protect local financial app session on app resume</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: colors.inputBg, true: colors.accent }}
            />
          </View>
        </View>

        {biometricEnabled && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>LOCK AFTER TIMEOUT</Text>
            {[
              { label: 'Immediately', value: 'immediately' },
              { label: 'After 1 Minute', value: '1min' },
              { label: 'After 5 Minutes', value: '5min' },
              { label: 'Never', value: 'never' },
            ].map(item => (
              <Pressable
                key={item.value}
                style={styles.timeoutRow}
                onPress={() => handleSelectTimeout(item.value as LockTimeoutSetting)}
              >
                <Text style={[styles.timeoutText, { color: colors.textPrimary }]}>{item.label}</Text>
                {timeout === item.value && <Ionicons name="checkmark" size={20} color={colors.accent} />}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timeoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  timeoutText: { fontSize: 14, fontWeight: '500' },
});
