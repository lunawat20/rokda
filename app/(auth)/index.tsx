// ROKDA AUTH LANDING / WELCOME SCREEN WITH GOOGLE LOGIN

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { signInWithGoogle } from '../../src/services/auth';

export default function AuthLandingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loginWithCredentials } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session?.user) {
        await loginWithCredentials(session.user);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In', e.message || 'Google sign-in completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.heroSection}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
          <Ionicons name="wallet" size={48} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rokda</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Local-first, privacy-focused personal finance manager.
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <View style={styles.featureRow}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
          <Text style={[styles.featureText, { color: colors.textPrimary }]}>100% Private & Local-First</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.accent} />
          <Text style={[styles.featureText, { color: colors.textPrimary }]}>Works Fully Offline</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          <Text style={[styles.featureText, { color: colors.textPrimary }]}>Biometric Face ID Protection</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        {/* Google OAuth Button */}
        <Pressable
          style={[styles.googleButton, { backgroundColor: '#FFFFFF' }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Create Account with Email</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Log In with Email</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  featuresSection: {
    gap: 14,
    marginVertical: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionSection: {
    gap: 12,
  },
  googleButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
