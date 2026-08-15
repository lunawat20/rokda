// ROKDA BIOMETRIC FACE ID LOCK OVERLAY

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { authenticateWithBiometrics } from '../src/services/biometrics';

export default function LockScreen() {
  const { colors } = useTheme();
  const { setIsLocked, signOut } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);

  const handleUnlock = async () => {
    setAuthenticating(true);
    try {
      const success = await authenticateWithBiometrics('Unlock Rokda to view your financial records');
      if (success) {
        setIsLocked(false);
      }
    } catch (e) {
      console.warn('Authentication error:', e);
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
          <Ionicons name="lock-closed" size={48} color={colors.accent} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Rokda is Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Authentication required to access your financial data.
        </Text>

        <Pressable
          style={[styles.unlockButton, { backgroundColor: colors.accent }]}
          onPress={handleUnlock}
          disabled={authenticating}
        >
          {authenticating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock with Face ID</Text>
            </>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={[styles.signOutText, { color: colors.danger }]}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  unlockButton: {
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
