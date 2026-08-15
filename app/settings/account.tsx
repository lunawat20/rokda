// ROKDA USER ACCOUNT & DELETION SCREEN

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { deleteUserAccount } from '../../src/services/auth';
import { exportBackupToFile } from '../../src/services/backup';

export default function AccountScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'Delete Rokda Account',
      'WARNING: This will permanently delete your remote cloud data and unmount your local database.\n\nWe strongly recommend backing up your data first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Backup Data First',
          onPress: async () => {
            await exportBackupToFile(user.id);
          }
        },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount(user.id);
              Alert.alert('Account Deleted', 'Your account and personal financial data have been purged.');
              router.replace('/(auth)');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>User Profile & Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.val, { color: colors.textPrimary }]}>{user?.user_metadata?.name || 'Rokda User'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.val, { color: colors.textPrimary }]}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>User ID</Text>
            <Text style={[styles.val, { color: colors.textMuted }]} numberOfLines={1}>{user?.id}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.deleteBtn, { borderColor: colors.danger }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Rokda Account</Text>
        </Pressable>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500' },
  val: { fontSize: 14, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
});
