// ROKDA REPORTS & CSV EXPORTER SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateCashFlow } from '../../src/services/financial';
import { exportTransactionsToCSV } from '../../src/services/export';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { transactions, categories, accounts } = useDb();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const cashFlow = calculateCashFlow(transactions);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await exportTransactionsToCSV(transactions, categories, accounts);
      Alert.alert('CSV Exported', 'Your transaction log has been compiled into CSV format.');
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Could not export CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reports & Export</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Period Overview</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Total Income</Text>
            <Text style={[styles.val, { color: colors.success }]}>+{formatPaise(cashFlow.incomePaise)}</Text>
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

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document-text" size={32} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 8 }]}>Export CSV Financial Report</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Export all transactions, merchants, amounts, categories, and notes to a standard CSV spreadsheet via iOS Share.
          </Text>

          <Pressable
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.exportBtnText}>Generate & Share CSV</Text>}
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
