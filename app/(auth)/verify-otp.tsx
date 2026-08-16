// ROKDA REAL-SYSTEM 6-DIGIT OTP VERIFICATION SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { verifyEmailOtp, resendEmailOtp } from '../../src/services/auth';
import { useAuth } from '../../src/context/AuthContext';

export default function VerifyOtpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { loginWithCredentials } = useAuth();

  const email = params.email || '';
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 6) {
      Alert.alert('Invalid Code', 'Please enter the full 6-digit code sent to your email.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyEmailOtp(email, otpCode.trim());
      if (res?.user) {
        await loginWithCredentials(res.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Email Verified!', 'Your account has been verified successfully.');
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Incorrect verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await resendEmailOtp(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Code Resent', `A new 6-digit verification code has been sent to ${email}`);
    } catch (e: any) {
      Alert.alert('Resend Error', e.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.content}>
            <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="mail-unread-outline" size={40} color={colors.accent} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit security verification code to:{'\n'}
              <Text style={[styles.emailHighlight, { color: colors.accent }]}>{email || 'your email'}</Text>
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>6-DIGIT VERIFICATION CODE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                value={otpCode}
                onChangeText={setOtpCode}
              />

              <Pressable
                style={[styles.verifyButton, { backgroundColor: colors.accent }]}
                onPress={handleVerifyOtp}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Create Account</Text>
                )}
              </Pressable>

              <View style={styles.resendRow}>
                <Text style={[styles.resendText, { color: colors.textMuted }]}>Didn't receive the code? </Text>
                <Pressable onPress={handleResendOtp} disabled={resending}>
                  <Text style={[styles.resendLink, { color: colors.accent }]}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  content: { gap: 16, marginTop: 10 },
  iconBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  emailHighlight: { fontWeight: '700' },
  formGroup: { gap: 14, marginTop: 16 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  input: { height: 56, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 20, fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center' },
  verifyButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  verifyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
});
