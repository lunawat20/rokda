// ROKDA MONTHLY CLOSE REVIEW SCREEN

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateCashFlow } from '../../src/services/financial';

export default function MonthlyReviewScreen() {
  const { colors } = useTheme();
  const { transactions } = useDb();
  const router = useRouter();

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const cashFlow = calculateCashFlow(transactions);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Monthly Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{currentMonthName}</Text>
          <Text style={[styles.monthSub, { color: colors.textMuted }]}>Performance Summary</Text>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Income</Text>
              <Text style={[styles.val, { color: colors.success }]}>+{formatPaise(cashFlow.incomePaise)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Expenses</Text>
              <Text style={[styles.val, { color: colors.danger }]}>-{formatPaise(cashFlow.expensePaise)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Net Savings</Text>
              <Text style={[styles.val, { color: colors.textPrimary }]}>{formatPaise(cashFlow.netPaise)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Savings Rate</Text>
              <Text style={[styles.val, { color: colors.accent }]}>{cashFlow.savingsRatePercent}%</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Budget Performance</Text>
          <Text style={[styles.cardVal, { color: colors.success }]}>Under Budget</Text>
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
  monthCard: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 12 },
  monthTitle: { fontSize: 22, fontWeight: '800' },
  monthSub: { fontSize: 13, marginTop: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  gridItem: { width: '47%', padding: 12, borderRadius: 12, backgroundColor: '#94A3B811' },
  label: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  val: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
});
