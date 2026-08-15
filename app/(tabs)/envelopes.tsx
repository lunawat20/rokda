// ROKDA ENVELOPES & ACTIVITY SCREEN (BESPOKE PREMIUM DESIGN)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';

type Segment = 'envelopes' | 'activity';
type CategoryFilter = 'all' | 'variable' | 'fixed' | 'goals';

export default function EnvelopesScreen() {
  const { colors } = useTheme();
  const { transactions, refreshData } = useDb();
  const router = useRouter();

  const [activeSegment, setActiveSegment] = useState<Segment>('envelopes');
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const defaultEnvelopes = [
    { id: 'env_rent', name: 'Rent & Housing', amountPaise: 2500000, targetPaise: 2500000, type: 'FIXED', icon: 'home-outline', color: '#8B5CF6' },
    { id: 'env_groceries', name: 'Groceries & Supplies', amountPaise: 345000, targetPaise: 1200000, type: 'VARIABLE', icon: 'cart-outline', color: '#10B981' },
    { id: 'env_dining', name: 'Dining out & Coffee', amountPaise: 48000, targetPaise: 500000, type: 'VARIABLE', icon: 'restaurant-outline', color: '#F59E0B' },
    { id: 'env_gadgets', name: 'Tech & Electronics', amountPaise: 249900, targetPaise: 800000, type: 'VARIABLE', icon: 'laptop-outline', color: '#EC4899' }
  ];

  const activeTxs = transactions.filter(t => !t.deleted_at);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Header & Segment Switcher */}
      <View style={styles.header}>
        <View style={styles.segmentRow}>
          <Pressable
            style={styles.segmentBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveSegment('envelopes');
            }}
          >
            <Text style={[styles.segmentText, activeSegment === 'envelopes' ? { color: colors.textPrimary } : { color: colors.textMuted }]}>
              Envelopes
            </Text>
            {activeSegment === 'envelopes' && <View style={[styles.activeBar, { backgroundColor: colors.accent }]} />}
          </Pressable>

          <Pressable
            style={styles.segmentBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveSegment('activity');
            }}
          >
            <Text style={[styles.segmentText, activeSegment === 'activity' ? { color: colors.textPrimary } : { color: colors.textMuted }]}>
              Activity
            </Text>
            {activeSegment === 'activity' && <View style={[styles.activeBar, { backgroundColor: colors.accent }]} />}
          </Pressable>
        </View>

        <Pressable
          style={[styles.addPlusBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/transaction/new');
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSegment === 'envelopes' ? (
          <>
            <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Monthly Envelope Budget Allocations</Text>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {(['all', 'variable', 'fixed', 'goals'] as CategoryFilter[]).map(f => (
                <Pressable
                  key={f}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    filter === f && { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.pillText, { color: filter === f ? colors.accent : colors.textSecondary }]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Envelopes List */}
            <View style={styles.envelopeList}>
              {defaultEnvelopes.map(env => (
                <View key={env.id} style={[styles.envelopeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.envIconBox, { backgroundColor: `${env.color}22` }]}>
                    <Ionicons name={env.icon as any} size={22} color={env.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.envTitleRow}>
                      <Text style={[styles.envName, { color: colors.textPrimary }]}>{env.name}</Text>
                      <View style={[styles.badge, { backgroundColor: `${env.color}33` }]}>
                        <Text style={[styles.badgeLabel, { color: env.color }]}>{env.type}</Text>
                      </View>
                    </View>
                    <Text style={[styles.envAmount, { color: colors.textPrimary }]}>
                      {formatPaise(env.amountPaise)}{' '}
                      <Text style={[styles.envTarget, { color: colors.textMuted }]}>/ {formatPaise(env.targetPaise)} target</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* Activity Segment */
          <View style={styles.activityContainer}>
            <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Chronological Transaction Audit</Text>

            {activeTxs.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={[styles.iconCircle, { backgroundColor: colors.cardBorder }]}>
                  <Ionicons name="receipt-outline" size={40} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No transactions logged yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Add an expense, income, or transfer to track your real-time financial velocity.
                </Text>

                <Pressable
                  style={[styles.logExpenseBtn, { backgroundColor: colors.accent }]}
                  onPress={() => router.push('/transaction/new')}
                >
                  <Text style={styles.logExpenseBtnText}>+ Log First Transaction</Text>
                </Pressable>
              </View>
            ) : (
              activeTxs.map(t => (
                <View key={t.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.txIconBox, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name={t.type === 'expense' ? 'arrow-up' : 'arrow-down'} size={18} color={t.type === 'expense' ? colors.danger : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txMerchant, { color: colors.textPrimary }]}>{t.merchant}</Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>{t.date} · {t.time}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: t.type === 'expense' ? colors.danger : colors.accent }]}>
                    {t.type === 'expense' ? '-' : '+'}{formatPaise(t.amount_paise)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 44 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  segmentRow: { flexDirection: 'row', gap: 20 },
  segmentBtn: { position: 'relative', paddingBottom: 6 },
  segmentText: { fontSize: 24, fontWeight: '800' },
  activeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 },
  addPlusBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  subHeader: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  pillRow: { gap: 8, marginBottom: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '700' },
  envelopeList: { gap: 12, marginBottom: 16 },
  envelopeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  envIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  envTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  envName: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  envAmount: { fontSize: 16, fontWeight: '800' },
  envTarget: { fontSize: 12, fontWeight: '500' },
  activityContainer: { paddingTop: 10 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  logExpenseBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20 },
  logExpenseBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  txIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txMerchant: { fontSize: 15, fontWeight: '700' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
});
