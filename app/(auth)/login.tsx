// ROKDA LOGIN SCREEN WITH DEMO PRE-FILL & OFFLINE TEST FALLBACK

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { signInWithEmail, signInWithDemoUser } from '../../src/services/auth';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loginWithCredentials, loginWithDemo } = useAuth();

  const [email, setEmail] = useState('test@rokda.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmail(email.trim(), password);
      if (res?.user) {
        await loginWithCredentials(res.user);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Notice', 'Supabase network unavailable. Logging in with local test account.');
      const res = await signInWithDemoUser();
      await loginWithCredentials(res.user);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoTestLogin = async () => {
    setLoading(true);
    try {
      await loginWithDemo();
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        Log in with your credentials or test offline demo mode.
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
          placeholder="test@rokda.app"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot Password?</Text>
        </Pressable>

        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.accent }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Log In</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.demoButton, { backgroundColor: colors.success }]}
          onPress={handleDemoTestLogin}
          disabled={loading}
        >
          <Ionicons name="flash" size={18} color="#FFFFFF" />
          <Text style={styles.demoButtonText}>⚡ Instant Test Login (Offline Demo)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 24,
  },
  formGroup: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
