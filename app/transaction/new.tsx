// ROKDA QUICK ADD TRANSACTION MODAL

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { parseInputToPaise } from '../../src/utils/currency';
import { saveTransaction, enqueueSyncItem } from '../../src/database/repository';
import { Transaction, TransactionType } from '../../src/types';

export default function QuickAddTransactionScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { accounts, categories, refreshData } = useDb();
  const router = useRouter();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [notes, setNotes] = useState('');

  const activeCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

  // Automatically select first valid account and category when data loads
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    if (!destAccountId && accounts.length > 1) {
      setDestAccountId(accounts[1].id);
    }
  }, [accounts, accountId, destAccountId]);

  useEffect(() => {
    if (activeCategories.length > 0 && (!categoryId || !activeCategories.some(c => c.id === categoryId))) {
      setCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, categoryId]);

  const handleSave = async () => {
    if (!user) return;
    if (!amountInput || parseFloat(amountInput) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monetary amount.');
      return;
    }
    if (!merchant.trim() && type !== 'transfer') {
      Alert.alert('Missing Merchant', 'Please enter a merchant name.');
      return;
    }

    const targetAccountId = accountId || (accounts.length > 0 ? accounts[0].id : '');
    if (!targetAccountId) {
      Alert.alert('Missing Account', 'Please select an account.');
      return;
    }

    const targetDestAccountId = destAccountId || (accounts.length > 1 ? accounts[1].id : '');

    if (type === 'transfer' && targetAccountId === targetDestAccountId) {
      Alert.alert('Invalid Transfer', 'Source and destination accounts must be different.');
      return;
    }

    const amountPaise = parseInputToPaise(amountInput);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      user_id: user.id,
      amount_paise: amountPaise,
      type,
      category_id: type === 'transfer' ? null : categoryId,
      account_id: targetAccountId,
      destination_account_id: type === 'transfer' ? targetDestAccountId : null,
      merchant: type === 'transfer' ? `Transfer to ${accounts.find(a => a.id === targetDestAccountId)?.name || 'Account'}` : merchant.trim(),
      date: dateStr,
      time: timeStr,
      notes: notes.trim(),
      is_recurring: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      version: 1
    };

    await saveTransaction(newTx);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'transactions',
      record_id: newTx.id,
      action: 'INSERT',
      payload_json: JSON.stringify(newTx)
    });

    await refreshData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Quick Add Transaction</Text>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close-circle" size={28} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Selector (Expense / Income / Transfer) */}
        <View style={[styles.typeContainer, { backgroundColor: colors.inputBg }]}>
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <Pressable
              key={t}
              style={[
                styles.typeTab,
                type === t && [styles.activeTypeTab, { backgroundColor: colors.card }]
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setType(t);
              }}
            >
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === t ? colors.textPrimary : colors.textMuted }
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>AMOUNT (INR)</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: colors.accent }]}>₹</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.textPrimary }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
              value={amountInput}
              onChangeText={setAmountInput}
            />
          </View>
        </View>

        {/* Merchant Input (If not transfer) */}
        {type !== 'transfer' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Merchant / Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. Starbucks, Grocery, Salary"
              placeholderTextColor={colors.textMuted}
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>
        )}

        {/* Account Selector */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {type === 'transfer' ? 'Source Account' : 'Account'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {accounts.map(acc => (
              <Pressable
                key={acc.id}
                style={[
                  styles.chip,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                  (accountId || accounts[0]?.id) === acc.id && { backgroundColor: colors.accentLight, borderColor: colors.accent }
                ]}
                onPress={() => setAccountId(acc.id)}
              >
                <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={16} color={(accountId || accounts[0]?.id) === acc.id ? colors.accent : colors.textMuted} />
                <Text style={[styles.chipText, { color: (accountId || accounts[0]?.id) === acc.id ? colors.accent : colors.textPrimary }]}>{acc.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Destination Account (If transfer) */}
        {type === 'transfer' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Destination Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {accounts.map(acc => (
                <Pressable
                  key={acc.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                    (destAccountId || accounts[1]?.id) === acc.id && { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  ]}
                  onPress={() => setDestAccountId(acc.id)}
                >
                  <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={16} color={(destAccountId || accounts[1]?.id) === acc.id ? colors.accent : colors.textMuted} />
                  <Text style={[styles.chipText, { color: (destAccountId || accounts[1]?.id) === acc.id ? colors.accent : colors.textPrimary }]}>{acc.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Selector (If not transfer) */}
        {type !== 'transfer' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {activeCategories.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                    categoryId === cat.id && { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Ionicons name={(cat.icon as any) || 'pricetag-outline'} size={16} color={categoryId === cat.id ? colors.accent : colors.textMuted} />
                  <Text style={[styles.chipText, { color: categoryId === cat.id ? colors.accent : colors.textPrimary }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
            placeholder="Add notes..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Transaction</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  typeContainer: { flexDirection: 'row', padding: 4, borderRadius: 14 },
  typeTab: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeTypeTab: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  typeTabText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  amountCard: { padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  currencySymbol: { fontSize: 32, fontWeight: '700', marginRight: 6 },
  amountInput: { fontSize: 36, fontWeight: '800', minWidth: 120, textAlign: 'center' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  saveButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
