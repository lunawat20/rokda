// ROKDA DAILY CALENDAR VIEW SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise } from '../../src/utils/currency';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { transactions } = useDb();
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const activeTx = transactions.filter(t => !t.deleted_at);
  const dayTx = activeTx.filter(t => t.date === selectedDate);

  let dayIncome = 0;
  let dayExpense = 0;

  dayTx.forEach(t => {
    if (t.type === 'income') dayIncome += t.amount_paise;
    else if (t.type === 'expense') dayExpense += t.amount_paise;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daily Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.dateTitle, { color: colors.textPrimary }]}>Date: {selectedDate}</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Income</Text>
              <Text style={[styles.val, { color: colors.success }]}>+{formatPaise(dayIncome)}</Text>
            </View>
            <View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Expenses</Text>
              <Text style={[styles.val, { color: colors.danger }]}>-{formatPaise(dayExpense)}</Text>
            </View>
            <View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Net</Text>
              <Text style={[styles.val, { color: colors.textPrimary }]}>{formatPaise(dayIncome - dayExpense)}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TRANSACTIONS ON THIS DAY</Text>

        {dayTx.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions on selected date</Text>
          </View>
        ) : (
          dayTx.map(t => (
            <View key={t.id} style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.merchantText, { color: colors.textPrimary }]}>{t.merchant}</Text>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{t.time}</Text>
              </View>
              <Text style={[styles.amountText, { color: t.type === 'expense' ? colors.danger : colors.success }]}>
                {t.type === 'expense' ? '-' : '+'}{formatPaise(t.amount_paise)}
              </Text>
            </View>
          ))
        )}
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
  dateTitle: { fontSize: 16, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  val: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  txCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1 },
  merchantText: { fontSize: 15, fontWeight: '600' },
  timeText: { fontSize: 12, marginTop: 2 },
  amountText: { fontSize: 15, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 8 },
  emptyText: { fontSize: 14 },
});
