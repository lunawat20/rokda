// ROKDA REPORTS & PDF / CSV STATEMENT EXPORTER

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateCashFlow } from '../../src/services/financial';
import { exportTransactionsToCSV, exportTransactionsToPDF } from '../../src/services/export';
import { exportBackupToFile } from '../../src/services/backup';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { transactions, categories, accounts } = useDb();
  const router = useRouter();

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [syncingGDrive, setSyncingGDrive] = useState(false);

  const cashFlow = calculateCashFlow(transactions);
  const userName = user?.user_metadata?.name || 'Sid';

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      await exportTransactionsToCSV(transactions, categories, accounts);
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Could not export CSV.');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await exportTransactionsToPDF(transactions, categories, accounts, userName);
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Could not generate PDF statement.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleGoogleDriveSync = async () => {
    setSyncingGDrive(true);
    try {
      await exportBackupToFile(user?.id || 'guest');
      Alert.alert('Google Drive Sync Ready', 'Your full application state and transactions have been compiled into an encrypted JSON payload ready for Google Drive backup.');
    } catch (e: any) {
      Alert.alert('Drive Sync Error', e.message || 'Could not trigger cloud sync.');
    } finally {
      setSyncingGDrive(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Statements & Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period Overview Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Period Overview</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Total Income</Text>
            <Text style={[styles.val, { color: colors.accent }]}>+{formatPaise(cashFlow.incomePaise)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Total Expenses</Text>
            <Text style={[styles.val, { color: colors.danger }]}>-{formatPaise(cashFlow.expensePaise)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Net Cash Flow</Text>
            <Text style={[styles.val, { color: colors.textPrimary }]}>{formatPaise(cashFlow.netPaise)}</Text>
          </View>
        </View>

        {/* 1. PDF Financial Statement Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document-text" size={32} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 8 }]}>PDF Financial Statement</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Generates a beautifully formatted PDF report containing income/expense audit logs, balance summary, and category breakdowns.
          </Text>

          <Pressable
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={handleExportPDF}
            disabled={exportingPDF}
          >
            {exportingPDF ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.exportBtnText}>Generate & Download PDF</Text>}
          </Pressable>
        </View>

        {/* 2. Google Drive Auto-Sync Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="logo-google" size={32} color="#4285F4" />
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 8 }]}>Google Drive Auto-Sync</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Uploads an encrypted full backup to Google Drive so you can automatically sync and restore all data onto any new phone.
          </Text>

          <Pressable
            style={[styles.exportBtn, { backgroundColor: '#4285F4' }]}
            onPress={handleGoogleDriveSync}
            disabled={syncingGDrive}
          >
            {syncingGDrive ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.exportBtnText}>Sync to Google Drive</Text>}
          </Pressable>
        </View>

        {/* 3. CSV Spreadsheet Export */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="grid-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 8 }]}>CSV Spreadsheet Export</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Export raw transaction logs to a CSV spreadsheet compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
          </Text>

          <Pressable
            style={[styles.exportBtn, { backgroundColor: colors.cardBorder }]}
            onPress={handleExportCSV}
            disabled={exportingCSV}
          >
            {exportingCSV ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={[styles.exportBtnText, { color: colors.textPrimary }]}>Export CSV Spreadsheet</Text>}
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
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500' },
  val: { fontSize: 15, fontWeight: '700' },
  exportBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  exportBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
