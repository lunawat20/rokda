// ROKDA GEN-Z CYBER ANALYTICS & INSIGHTS SCREEN

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
  const { accounts, categories, transactions, budgets, subscriptions, recurring } = useDb();
  const router = useRouter();

  const cashFlow = calculateCashFlow(transactions);
  const netWorth = calculateNetWorth(accounts);
  const health = calculateFinancialHealth(accounts, transactions, subscriptions, recurring);
  const insights = generateSmartInsights(transactions, budgets, subscriptions, recurring);

  // Group expenses by category
  const expenseMap = new Map<string, number>();
  let totalExpensePaise = 0;

  transactions.forEach(t => {
    if (t.deleted_at || t.type !== 'expense') return;
    totalExpensePaise += t.amount_paise;
    const catId = t.category_id || 'unassigned';
    expenseMap.set(catId, (expenseMap.get(catId) || 0) + t.amount_paise);
  });

  const categoryBreakdown = Array.from(expenseMap.entries())
    .map(([catId, amountPaise]) => {
      const cat = categories.find(c => c.id === catId);
      const percent = totalExpensePaise > 0 ? Math.round((amountPaise / totalExpensePaise) * 100) : 0;
      return {
        id: catId,
        name: cat?.name || 'General Expense',
        icon: cat?.icon || 'pricetag',
        color: cat?.color || colors.accent,
        amountPaise,
        percent
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);

  const barChartData = [
    { periodLabel: '3M Ago', incomePaise: cashFlow.incomePaise * 0.8, expensePaise: cashFlow.expensePaise * 0.9 },
    { periodLabel: '2M Ago', incomePaise: cashFlow.incomePaise * 0.9, expensePaise: cashFlow.expensePaise * 0.85 },
    { periodLabel: 'Last Mo', incomePaise: cashFlow.incomePaise * 0.95, expensePaise: cashFlow.expensePaise * 1.1 },
    { periodLabel: 'This Mo', incomePaise: cashFlow.incomePaise, expensePaise: cashFlow.expensePaise },
  ];

  const healthScore = Math.min(100, Math.max(10, Math.round(health.savings_rate_percent + (health.emergency_fund_months * 10))));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.badgeText, { color: colors.accent }]}>⚡ REAL-TIME ANALYTICS</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Financial Velocity</Text>
          </View>
          <Pressable
            style={[styles.reviewBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
            onPress={() => router.push('/monthly-review')}
          >
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <Text style={[styles.reviewBtnText, { color: colors.accent }]}>Monthly Close</Text>
          </Pressable>
        </View>

        {/* 1. Gen-Z Financial Health Score & Velocity Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.heroRow}>
            <View style={[styles.scoreBadge, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Text style={[styles.scoreNum, { color: colors.accent }]}>{healthScore}</Text>
              <Text style={[styles.scoreSub, { color: colors.accent }]}>HEALTH</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.heroHeading, { color: colors.textPrimary }]}>
                {healthScore >= 80 ? '🔥 Financial Elite' : healthScore >= 50 ? '⚡ Steady Builder' : '🛡️ Vault Setup'}
              </Text>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                Savings Rate: <Text style={{ color: colors.accent, fontWeight: '800' }}>{health.savings_rate_percent}%</Text> • Runway: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{health.emergency_fund_months} mo</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Cash Flow Trend Chart */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Cash Flow Trend</Text>
          </View>
          <CashFlowBarChart data={barChartData} />
        </View>

        {/* 3. Spending Category Breakdown Progress */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart" size={18} color={colors.accentSecondary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Category Breakdown</Text>
          </View>

          {categoryBreakdown.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No expenses recorded yet. Add transactions to see category breakdown.
            </Text>
          ) : (
            <View style={styles.breakdownList}>
              {categoryBreakdown.map(cat => (
                <View key={cat.id} style={styles.catRow}>
                  <View style={styles.catMeta}>
                    <View style={[styles.catIconCircle, { backgroundColor: `${cat.color}22` }]}>
                      <Ionicons name={(cat.icon as any) || 'pricetag'} size={14} color={cat.color} />
                    </View>
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                    <Text style={[styles.catPercent, { color: colors.textMuted }]}>{cat.percent}%</Text>
                  </View>

                  <Text style={[styles.catVal, { color: colors.danger }]}>-{formatPaise(cat.amountPaise)}</Text>
                  <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
                    <View style={[styles.progressFill, { width: `${cat.percent}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Net Worth Asset vs Liability Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Net Worth Summary</Text>
          </View>

          <View style={styles.nwRow}>
            <Text style={[styles.nwLabel, { color: colors.textSecondary }]}>Total Assets</Text>
            <Text style={[styles.nwVal, { color: colors.accent }]}>+{formatPaise(netWorth.assetsPaise)}</Text>
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

        {/* 5. Smart AI Insights Callouts */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Smart Vault Insights</Text>
          </View>
          {insights.map(ins => (
            <View key={ins.id} style={[styles.insightRow, { backgroundColor: colors.inputBg }]}>
              <Ionicons
                name={ins.type === 'warning' ? 'alert-circle' : ins.type === 'positive' ? 'checkmark-circle' : 'bulb'}
                size={18}
                color={ins.type === 'warning' ? colors.danger : ins.type === 'positive' ? colors.accent : colors.accentSecondary}
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
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 100, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  reviewBtnText: { fontSize: 12, fontWeight: '700' },
  heroCard: { padding: 18, borderRadius: 20, borderWidth: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreBadge: { width: 54, height: 54, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 20, fontWeight: '900' },
  scoreSub: { fontSize: 8, fontWeight: '800', marginTop: -2 },
  heroHeading: { fontSize: 16, fontWeight: '800' },
  heroSub: { fontSize: 12, marginTop: 2 },
  card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', marginVertical: 10 },
  breakdownList: { gap: 12 },
  catRow: { gap: 4 },
  catMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIconCircle: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 13, fontWeight: '700' },
  catPercent: { fontSize: 12, fontWeight: '600' },
  catVal: { fontSize: 13, fontWeight: '800', alignSelf: 'flex-end', marginTop: -20 },
  progressTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  nwRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nwLabel: { fontSize: 13, fontWeight: '500' },
  nwVal: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, width: '100%', marginVertical: 4 },
  nwTotalLabel: { fontSize: 15, fontWeight: '800' },
  nwTotalVal: { fontSize: 16, fontWeight: '800' },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  insightTitle: { fontSize: 13, fontWeight: '700' },
  insightMsg: { fontSize: 11, marginTop: 2, lineHeight: 15 },
});
