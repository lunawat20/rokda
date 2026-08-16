// ROKDA BESPOKE HOME DASHBOARD (TRUE ZERO STATE & PREMIUM IDENTITY)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';
import { calculateCashFlow, calculateNetWorth, generateSmartInsights } from '../../src/services/financial';
import { syncUserData } from '../../src/services/sync';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { accounts, categories, transactions, budgets, subscriptions, recurring, refreshData } = useDb();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const userName = user?.user_metadata?.name || 'Sidd';
  const userInitials = userName.substring(0, 2).toUpperCase();

  const netWorth = calculateNetWorth(accounts);
  const cashFlow = calculateCashFlow(transactions);
  const smartInsights = generateSmartInsights(transactions, budgets, subscriptions, recurring);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await syncUserData(user.id);
    }
    await refreshData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* 1. Header with User Initials Avatar */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
          </View>

          <Pressable
            style={[styles.avatarBox, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
            onPress={() => router.push('/settings/account')}
          >
            <Text style={[styles.avatarText, { color: colors.accent }]}>{userInitials}</Text>
          </Pressable>
        </View>

        {/* 2. Hero Net Worth & Cash Flow Summary Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.heroHeaderRow}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>TOTAL NET WORTH</Text>
            <View style={[styles.statusTag, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
              <Text style={[styles.statusTagText, { color: colors.accent }]}>Local Encrypted</Text>
            </View>
          </View>

          <Text style={[styles.netWorthVal, { color: colors.textPrimary }]}>
            {formatPaise(accounts.length > 0 ? netWorth.netWorthPaise : 0)}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Income vs Expense Pills */}
          <View style={styles.cashFlowRow}>
            <View style={styles.cfItem}>
              <View style={styles.cfLabelRow}>
                <Ionicons name="arrow-down-circle" size={16} color={colors.accent} />
                <Text style={[styles.cfLabel, { color: colors.textMuted }]}>INCOME</Text>
              </View>
              <Text style={[styles.cfValue, { color: colors.accent }]}>+{formatPaise(cashFlow.incomePaise)}</Text>
            </View>

            <View style={styles.cfItem}>
              <View style={styles.cfLabelRow}>
                <Ionicons name="arrow-up-circle" size={16} color={colors.danger} />
                <Text style={[styles.cfLabel, { color: colors.textMuted }]}>EXPENSES</Text>
              </View>
              <Text style={[styles.cfValue, { color: colors.danger }]}>-{formatPaise(cashFlow.expensePaise)}</Text>
            </View>
          </View>

          {/* Quick Action Button Cluster */}
          <View style={styles.actionCluster}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/transaction/new');
              }}
            >
              <Ionicons name="remove-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Expense</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/transaction/new');
              }}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Income</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.cardBorder }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/transaction/new');
              }}
            >
              <Ionicons name="swap-horizontal" size={18} color={colors.textPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Transfer</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Multi-Account Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Accounts & Balances</Text>
          <Pressable onPress={() => router.push('/accounts')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>+ Add Account</Text>
          </Pressable>
        </View>

        {accounts.length === 0 ? (
          <Pressable
            style={[styles.emptyAccountCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/accounts')}
          >
            <Ionicons name="card-outline" size={28} color={colors.accent} />
            <Text style={[styles.emptyAccTitle, { color: colors.textPrimary }]}>No Accounts Added Yet</Text>
            <Text style={[styles.emptyAccSub, { color: colors.textMuted }]}>
              Tap here to add your Cash, HDFC Bank, or Credit Card account.
            </Text>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountRow}>
            {accounts.map(acc => (
              <Pressable
                key={acc.id}
                style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => router.push('/accounts')}
              >
                <View style={styles.accCardHeader}>
                  <Ionicons name={(acc.icon as any) || 'card-outline'} size={20} color={acc.color || colors.accent} />
                  <Text style={[styles.accTypeBadge, { color: colors.textMuted }]}>{acc.type.toUpperCase()}</Text>
                </View>
                <Text style={[styles.accName, { color: colors.textSecondary }]}>{acc.name}</Text>
                <Text style={[styles.accBalance, { color: colors.textPrimary }]}>{formatPaise(acc.current_balance_paise)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* 4. Envelopes / Category Budgets Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Envelopes</Text>
          <Pressable onPress={() => router.push('/envelopes' as any)}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>All Envelopes →</Text>
          </Pressable>
        </View>

        {budgets.length === 0 ? (
          <Pressable
            style={[styles.emptyEnvelopeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/envelopes' as any)}
          >
            <Ionicons name="folder-open-outline" size={28} color={colors.accent} />
            <Text style={[styles.emptyAccTitle, { color: colors.textPrimary }]}>No Budget Envelopes Set</Text>
            <Text style={[styles.emptyAccSub, { color: colors.textMuted }]}>
              Create monthly spending envelopes for Rent, Groceries, & Coffee.
            </Text>
          </Pressable>
        ) : (
          <View style={styles.envelopeGrid}>
            {budgets.map(b => {
              const cat = categories.find(c => c.id === b.category_id);
              const catTxs = transactions.filter(t => !t.deleted_at && t.type === 'expense' && t.category_id === b.category_id);
              const spentPaise = catTxs.reduce((sum, t) => sum + t.amount_paise, 0);
              const percent = Math.min(100, Math.round((spentPaise / b.amount_paise) * 100));

              return (
                <Pressable
                  key={b.id}
                  style={[styles.envTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push('/envelopes' as any)}
                >
                  <View style={styles.envTop}>
                    <View style={[styles.envIconCircle, { backgroundColor: `${cat?.color || colors.accent}22` }]}>
                      <Ionicons name={(cat?.icon as any) || 'folder-outline'} size={18} color={cat?.color || colors.accent} />
                    </View>
                  </View>

                  <View style={styles.envBottom}>
                    <Text style={[styles.envTitle, { color: colors.textPrimary }]}>{cat?.name || 'Category'}</Text>
                    <Text style={[styles.envPaise, { color: colors.textPrimary }]}>
                      {formatPaise(spentPaise)}{' '}
                      <Text style={[styles.envTargetPaise, { color: colors.textMuted }]}>/ {formatPaise(b.amount_paise)}</Text>
                    </Text>

                    {/* Progress Bar */}
                    <View style={[styles.barTrack, { backgroundColor: colors.inputBg }]}>
                      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: cat?.color || colors.accent }]} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 5. Smart Insights Callout */}
        {smartInsights.length > 0 && (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.accent }]}>{smartInsights[0].title}</Text>
              <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>{smartInsights[0].message}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 44 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  heroCard: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 12 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  netWorthVal: { fontSize: 38, fontWeight: '800' },
  divider: { height: 1, width: '100%', marginVertical: 4 },
  cashFlowRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cfItem: { gap: 2 },
  cfLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cfLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cfValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  actionCluster: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAllText: { fontSize: 13, fontWeight: '700' },
  accountRow: { gap: 12, paddingVertical: 4 },
  accountCard: { width: 140, padding: 14, borderRadius: 18, borderWidth: 1, gap: 8 },
  accCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accTypeBadge: { fontSize: 9, fontWeight: '800' },
  accName: { fontSize: 13, fontWeight: '600' },
  accBalance: { fontSize: 16, fontWeight: '800' },
  emptyAccountCard: { padding: 20, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyEnvelopeCard: { padding: 20, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyAccTitle: { fontSize: 15, fontWeight: '700' },
  emptyAccSub: { fontSize: 12, textAlign: 'center' },
  envelopeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  envTile: { width: '48%', padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  envTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  envIconCircle: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  envBottom: { gap: 2 },
  envTitle: { fontSize: 13, fontWeight: '700' },
  envPaise: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  envTargetPaise: { fontSize: 11, fontWeight: '500' },
  barTrack: { height: 4, borderRadius: 2, width: '100%', marginTop: 8, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 4 },
  insightTitle: { fontSize: 14, fontWeight: '700' },
  insightDesc: { fontSize: 12, marginTop: 2 },
});
