// ROKDA ENVELOPES & ACTIVITY AUDIT SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, parseInputToPaise } from '../../src/utils/currency';
import { saveBudget, enqueueSyncItem } from '../../src/database/repository';
import { Budget } from '../../src/types';

export default function EnvelopesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { categories, transactions, budgets, refreshData } = useDb();
  const router = useRouter();

  const [segment, setSegment] = useState<'ENVELOPES' | 'ACTIVITY'>('ENVELOPES');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const activeExpenseCategories = categories.filter(c => c.type === 'expense');

  const handleCreateEnvelope = async () => {
    if (!user) return;
    if (!selectedCatId) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }
    if (!targetInput || parseFloat(targetInput) <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid monthly budget limit.');
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newBudget: Budget = {
      id: `bg_${Date.now()}`,
      user_id: user.id,
      category_id: selectedCatId,
      amount_paise: parseInputToPaise(targetInput),
      period: 'monthly',
      start_date: todayStr,
      rollover_enabled: false,
      alert_threshold_percent: 80,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      version: 1
    };

    await saveBudget(newBudget);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'budgets',
      record_id: newBudget.id,
      action: 'INSERT',
      payload_json: JSON.stringify(newBudget)
    });

    await refreshData();
    setModalVisible(false);
    setTargetInput('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Category Envelopes</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.accentLight }]}
          onPress={() => {
            if (activeExpenseCategories.length > 0) {
              setSelectedCatId(activeExpenseCategories[0].id);
            }
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={20} color={colors.accent} />
          <Text style={[styles.addBtnText, { color: colors.accent }]}>Envelope</Text>
        </Pressable>
      </View>

      {/* Segment Switcher */}
      <View style={[styles.segmentBox, { backgroundColor: colors.inputBg }]}>
        <Pressable
          style={[styles.segTab, segment === 'ENVELOPES' && [styles.segTabActive, { backgroundColor: colors.card }]]}
          onPress={() => setSegment('ENVELOPES')}
        >
          <Text style={[styles.segText, { color: segment === 'ENVELOPES' ? colors.textPrimary : colors.textMuted }]}>
            ENVELOPES ({budgets.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segTab, segment === 'ACTIVITY' && [styles.segTabActive, { backgroundColor: colors.card }]]}
          onPress={() => setSegment('ACTIVITY')}
        >
          <Text style={[styles.segText, { color: segment === 'ACTIVITY' ? colors.textPrimary : colors.textMuted }]}>
            ACTIVITY LOG ({transactions.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {segment === 'ENVELOPES' ? (
          budgets.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="folder-open-outline" size={36} color={colors.accent} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Monthly Envelopes Created</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Set up monthly spending budgets for Groceries, Rent, or Cabs to keep your finances organized.
              </Text>
              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  if (activeExpenseCategories.length > 0) setSelectedCatId(activeExpenseCategories[0].id);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.createBtnText}>+ Create First Envelope</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.envelopeList}>
              {budgets.map(b => {
                const cat = categories.find(c => c.id === b.category_id);
                const catTxs = transactions.filter(t => !t.deleted_at && t.type === 'expense' && t.category_id === b.category_id);
                const spentPaise = catTxs.reduce((sum, t) => sum + t.amount_paise, 0);
                const remainingPaise = b.amount_paise - spentPaise;
                const percent = Math.min(100, Math.round((spentPaise / b.amount_paise) * 100));

                return (
                  <View key={b.id} style={[styles.envelopeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.cardRow}>
                      <View style={[styles.iconBox, { backgroundColor: `${cat?.color || colors.accent}22` }]}>
                        <Ionicons name={(cat?.icon as any) || 'pricetag'} size={20} color={cat?.color || colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.envName, { color: colors.textPrimary }]}>{cat?.name || 'Category'}</Text>
                        <Text style={[styles.envSub, { color: colors.textMuted }]}>
                          {formatPaise(spentPaise)} spent of {formatPaise(b.amount_paise)}
                        </Text>
                      </View>
                      <Text style={[styles.remainingVal, { color: remainingPaise >= 0 ? colors.accent : colors.danger }]}>
                        {remainingPaise >= 0 ? formatPaise(remainingPaise) : `-${formatPaise(Math.abs(remainingPaise))}`} left
                      </Text>
                    </View>

                    <View style={[styles.barTrack, { backgroundColor: colors.inputBg }]}>
                      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: cat?.color || colors.accent }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ) : (
          /* Activity Log */
          transactions.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="receipt-outline" size={36} color={colors.accent} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Transactions Recorded</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Tap the + Quick Add button to add your first expense or income entry.
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {transactions.map(t => {
                const cat = categories.find(c => c.id === t.category_id);
                const isExpense = t.type === 'expense';

                return (
                  <View key={t.id} style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={[styles.iconBox, { backgroundColor: `${cat?.color || colors.accent}22` }]}>
                      <Ionicons name={(cat?.icon as any) || (isExpense ? 'arrow-up' : 'arrow-down')} size={18} color={cat?.color || colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txMerchant, { color: colors.textPrimary }]}>{t.merchant || 'Transaction'}</Text>
                      <Text style={[styles.txDate, { color: colors.textMuted }]}>{t.date} • {t.time}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isExpense ? colors.danger : colors.accent }]}>
                      {isExpense ? '-' : '+'}{formatPaise(t.amount_paise)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>

      {/* Modal: Add Budget Envelope */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Budget Envelope</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {activeExpenseCategories.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                    selectedCatId === cat.id && { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  ]}
                  onPress={() => setSelectedCatId(cat.id)}
                >
                  <Ionicons name={(cat.icon as any) || 'pricetag-outline'} size={16} color={selectedCatId === cat.id ? colors.accent : colors.textMuted} />
                  <Text style={[styles.chipText, { color: selectedCatId === cat.id ? colors.accent : colors.textPrimary }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 10 }]}>Monthly Budget Limit (INR)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. 15000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={targetInput}
              onChangeText={setTargetInput}
            />

            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.accent, marginTop: 16 }]}
              onPress={handleCreateEnvelope}
            >
              <Text style={styles.createBtnText}>Save Envelope</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 44 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  segmentBox: { flexDirection: 'row', marginHorizontal: 20, padding: 4, borderRadius: 14, marginBottom: 12 },
  segTab: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segTabActive: { elevation: 2 },
  segText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyBox: { padding: 30, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  createBtn: { paddingHorizontal: 20, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  envelopeList: { gap: 12 },
  envelopeCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  envName: { fontSize: 15, fontWeight: '700' },
  envSub: { fontSize: 12, marginTop: 2 },
  remainingVal: { fontSize: 13, fontWeight: '800' },
  barTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  activityList: { gap: 10 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  txMerchant: { fontSize: 14, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  modalBox: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
});
