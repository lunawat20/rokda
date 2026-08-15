// ROKDA LOCAL BACKUP & RESTORE HUB SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { exportBackupToFile, validateBackupContent, restoreBackupData } from '../../src/services/backup';

export default function BackupScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { refreshData } = useDb();
  const router = useRouter();

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportBackupToFile(user.id);
      Alert.alert('Export Complete', 'Your Rokda backup JSON file has been generated and ready to share.');
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Could not export backup.');
    } finally {
      setExporting(false);
    }
  };

  const handlePickAndRestoreFile = async () => {
    if (!user) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const fileUri = res.assets[0].uri;
      const jsonContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });

      // Pre-Restore Verification
      const validation = validateBackupContent(jsonContent);
      if (!validation.isValid) {
        Alert.alert('Backup Validation Error', validation.errorMessage || 'Invalid backup file.');
        return;
      }

      // Show Preview & Confirmation
      Alert.alert(
        'Confirm Restore',
        `File validated successfully!\n\nBackup Date: ${validation.createdAt.split('T')[0]}\nRecords Found:\n• Transactions: ${validation.recordCounts.transactions}\n• Accounts: ${validation.recordCounts.accounts}\n• Budgets: ${validation.recordCounts.budgets}\n• Goals: ${validation.recordCounts.goals}\n\nRestore this data into your workspace?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore Data',
            onPress: async () => {
              setRestoring(true);
              try {
                await restoreBackupData(jsonContent, user.id);
                await refreshData();
                Alert.alert('Restore Complete', 'Your financial data has been successfully restored.');
              } catch (e: any) {
                Alert.alert('Restore Error', e.message || 'Failed to restore backup data.');
              } finally {
                setRestoring(false);
              }
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not read selected file.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Local Backup & Restore</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Export Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="cloud-upload" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Export Local JSON Backup</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Generates a complete encrypted JSON file containing all your accounts, transactions, budgets, and settings.
          </Text>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.accent }]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>Export & Share Backup</Text>}
          </Pressable>
        </View>

        {/* Restore Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="cloud-download" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Restore from JSON File</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Imports financial records from a previously created Rokda backup file after integrity validation.
          </Text>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder }]}
            onPress={handlePickAndRestoreFile}
            disabled={restoring}
          >
            {restoring ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={[styles.btnText, { color: colors.textPrimary }]}>Pick & Validate Backup File</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 12 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  actionBtn: { width: '100%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
