// ROKDA TRANSACTION DETAILS & EDIT SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, paiseToCurrency, parseInputToPaise } from '../../src/utils/currency';
import { saveTransaction, deleteTransaction, enqueueSyncItem } from '../../src/database/repository';

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { transactions, categories, accounts, refreshData } = useDb();
  const router = useRouter();

  const tx = transactions.find(t => t.id === id);
  const cat = tx?.category_id ? categories.find(c => c.id === tx.category_id) : null;
  const acc = tx ? accounts.find(a => a.id === tx.account_id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState(tx?.merchant || '');
  const [amountInput, setAmountInput] = useState(tx ? paiseToCurrency(tx.amount_paise).toString() : '');
  const [notes, setNotes] = useState(tx?.notes || '');

  if (!tx) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textPrimary }}>Transaction not found.</Text>
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!user) return;
    const amountPaise = parseInputToPaise(amountInput);

    const updatedTx = {
      ...tx,
      merchant: merchant.trim(),
      amount_paise: amountPaise,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
      version: tx.version + 1
    };

    await saveTransaction(updatedTx);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'transactions',
      record_id: updatedTx.id,
      action: 'UPDATE',
      payload_json: JSON.stringify(updatedTx)
    });

    await refreshData();
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = async () => {
    if (!user) return;
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(tx.id);
          await enqueueSyncItem({
            id: `sync_${Date.now()}`,
            user_id: user.id,
            table_name: 'transactions',
            record_id: tx.id,
            action: 'DELETE',
            payload_json: JSON.stringify({ id: tx.id })
          });
          await refreshData();
          router.back();
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transaction Details</Text>
        <Pressable onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.typeBadge, { color: tx.type === 'expense' ? colors.danger : tx.type === 'income' ? colors.success : colors.accent }]}>
            {tx.type.toUpperCase()}
          </Text>

          {isEditing ? (
            <TextInput
              style={[styles.editAmountInput, { color: colors.textPrimary }]}
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
            />
          ) : (
            <Text style={[styles.amountText, { color: colors.textPrimary }]}>
              {formatPaise(tx.amount_paise)}
            </Text>
          )}

          {isEditing ? (
            <TextInput
              style={[styles.editMerchantInput, { color: colors.textPrimary, backgroundColor: colors.inputBg }]}
              value={merchant}
              onChangeText={setMerchant}
            />
          ) : (
            <Text style={[styles.merchantText, { color: colors.textPrimary }]}>{tx.merchant}</Text>
          )}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Category</Text>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{cat?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account</Text>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{acc?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date & Time</Text>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{tx.date} at {tx.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.notesInput, { color: colors.textPrimary, backgroundColor: colors.inputBg }]}
                value={notes}
                onChangeText={setNotes}
              />
            ) : (
              <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{tx.notes || 'None'}</Text>
            )}
          </View>
        </View>

        {isEditing && (
          <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleUpdate}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>
        )}

        <Pressable style={[styles.deleteBtn, { borderColor: colors.danger }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Transaction</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  amountCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
  },
  editAmountInput: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  merchantText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  editMerchantInput: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    width: '80%',
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'right',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
