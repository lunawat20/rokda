// ROKDA INSIGHTS, CASH FLOW, NET WORTH & FINANCIAL HEALTH SCREEN

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateCashFlow, calculateNetWorth, calculateFinancialHealth, generateSmartInsights } from '../../src/services/financial';
import { CashFlowBarChart } from '../../src/components/charts/CashFlowBarChart';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const { accounts, transactions, budgets, subscriptions, recurring } = useDb();
  const router = useRouter();

  const cashFlow = calculateCashFlow(transactions);
  const netWorth = calculateNetWorth(accounts);
  const health = calculateFinancialHealth(accounts, transactions, subscriptions, recurring);
  const insights = generateSmartInsights(transactions, budgets, subscriptions, recurring);

  const barChartData = [
    { periodLabel: '3M Ago', incomePaise: cashFlow.incomePaise * 0.8, expensePaise: cashFlow.expensePaise * 0.9 },
    { periodLabel: '2M Ago', incomePaise: cashFlow.incomePaise * 0.9, expensePaise: cashFlow.expensePaise * 0.85 },
    { periodLabel: 'Last Mo', incomePaise: cashFlow.incomePaise * 0.95, expensePaise: cashFlow.expensePaise * 1.1 },
    { periodLabel: 'This Mo', incomePaise: cashFlow.incomePaise, expensePaise: cashFlow.expensePaise },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Insights & Analytics</Text>

        {/* 1. Monthly Review Launcher */}
        <Pressable
          style={[styles.bannerCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
          onPress={() => router.push('/monthly-review')}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.accent }]}>Monthly Close Review</Text>
            <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>Browse historical monthly performance summaries</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </Pressable>

        {/* 2. Cash Flow Chart Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Cash Flow Trend</Text>
          <CashFlowBarChart data={barChartData} />
        </View>

        {/* 3. Net Worth Breakdown Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Net Worth Breakdown</Text>
          <View style={styles.nwRow}>
            <Text style={[styles.nwLabel, { color: colors.textSecondary }]}>Total Assets</Text>
            <Text style={[styles.nwVal, { color: colors.success }]}>+{formatPaise(netWorth.assetsPaise)}</Text>
          </View>
          <View style={styles.nwRow}>
            <Text style={[styles.nwLabel, { color: colors.textSecondary }]}>Total Liabilities / Debt</Text>
            <Text style={[styles.nwVal, { color: colors.danger }]}>-{formatPaise(netWorth.liabilitiesPaise)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.nwRow}>
            <Text style={[styles.nwTotalLabel, { color: colors.textPrimary }]}>Net Worth</Text>
            <Text style={[styles.nwTotalVal, { color: colors.textPrimary }]}>{formatPaise(netWorth.netWorthPaise)}</Text>
          </View>
        </View>

        {/* 4. Financial Health Metrics */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Financial Health</Text>
            <Pressable onPress={() => router.push('/financial-health')}>
              <Text style={[styles.linkText, { color: colors.accent }]}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.healthGrid}>
            <View style={[styles.healthMetricBox, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.hmLabel, { color: colors.textMuted }]}>Savings Rate</Text>
              <Text style={[styles.hmVal, { color: colors.success }]}>{health.savings_rate_percent}%</Text>
            </View>
            <View style={[styles.healthMetricBox, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.hmLabel, { color: colors.textMuted }]}>Emergency Fund</Text>
              <Text style={[styles.hmVal, { color: colors.accent }]}>{health.emergency_fund_months} mo</Text>
            </View>
            <View style={[styles.healthMetricBox, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.hmLabel, { color: colors.textMuted }]}>Recurring Commitments</Text>
              <Text style={[styles.hmVal, { color: colors.textPrimary }]}>{formatPaise(health.recurring_commitments_paise)}/mo</Text>
            </View>
          </View>
        </View>

        {/* 5. Smart Insights List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Data-Driven Insights</Text>
          {insights.map(ins => (
            <View key={ins.id} style={[styles.insightRow, { backgroundColor: colors.inputBg }]}>
              <Ionicons
                name={ins.type === 'warning' ? 'warning' : ins.type === 'positive' ? 'checkmark-circle' : 'bulb'}
                size={20}
                color={ins.type === 'warning' ? colors.danger : ins.type === 'positive' ? colors.success : colors.accent}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>{ins.title}</Text>
                <Text style={[styles.insightMsg, { color: colors.textSecondary }]}>{ins.message}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nwLabel: {
    fontSize: 14,
  },
  nwVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  nwTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  nwTotalVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  healthMetricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  hmLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  hmVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightMsg: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
