// ROKDA FINANCIAL HEALTH METRICS SCREEN

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateFinancialHealth } from '../../src/services/financial';

export default function FinancialHealthScreen() {
  const { colors } = useTheme();
  const { accounts, transactions, subscriptions, recurring } = useDb();
  const router = useRouter();

  const health = calculateFinancialHealth(accounts, transactions, subscriptions, recurring);

  const metrics = [
    { label: 'Savings Rate', val: `${health.savings_rate_percent}%`, desc: 'Target: 20%+ of monthly income' },
    { label: 'Budget Adherence', val: `${health.budget_adherence_percent}%`, desc: 'Category budget limit discipline' },
    { label: 'Recurring Commitments', val: `${formatPaise(health.recurring_commitments_paise)}/mo`, desc: 'Fixed monthly bills & subscriptions' },
    { label: 'Emergency Fund Coverage', val: `${health.emergency_fund_months} Months`, desc: 'Liquid savings vs monthly expense' },
    { label: 'Total Debt', val: formatPaise(health.debt_total_paise), desc: 'Credit cards & active loans' },
    { label: 'Net Worth', val: formatPaise(health.net_worth_paise), desc: 'Total Assets minus Total Liabilities' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Financial Health Score</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {metrics.map((m, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{m.label}</Text>
            <Text style={[styles.val, { color: colors.textPrimary }]}>{m.val}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{m.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  val: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  desc: { fontSize: 12, marginTop: 4 },
});
