// ROKDA SUBSCRIPTIONS MANAGER HUB

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, parseInputToPaise } from '../../src/utils/currency';
import { saveSubscription, deleteSubscription, enqueueSyncItem } from '../../src/database/repository';
import { Subscription } from '../../src/types';

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { subscriptions, refreshData } = useDb();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const activeSubs = subscriptions.filter(s => !s.deleted_at);

  const monthlyTotalPaise = activeSubs.reduce((sum, s) => {
    return sum + (s.billing_cycle === 'annual' ? Math.round(s.amount_paise / 12) : s.amount_paise);
  }, 0);

  const annualTotalPaise = monthlyTotalPaise * 12;

  const handleCreateSub = async () => {
    if (!user) return;
    if (!name.trim() || !amountInput) {
      Alert.alert('Missing Fields', 'Please enter subscription name and amount.');
      return;
    }

    const amountPaise = parseInputToPaise(amountInput);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      user_id: user.id,
      name: name.trim(),
      amount_paise: amountPaise,
      billing_cycle: billingCycle,
      next_billing_date: nextDate.toISOString().split('T')[0],
      icon: 'tv',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    await saveSubscription(newSub);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'subscriptions',
      record_id: newSub.id,
      action: 'INSERT',
      payload_json: JSON.stringify(newSub)
    });

    await refreshData();
    setModalVisible(false);
    setName('');
    setAmountInput('');
  };

  const handleDeleteSub = async (id: string) => {
    if (!user) return;
    Alert.alert('Delete Subscription', 'Are you sure you want to remove this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSubscription(id);
          await enqueueSyncItem({
            id: `sync_${Date.now()}`,
            user_id: user.id,
            table_name: 'subscriptions',
            record_id: id,
            action: 'DELETE',
            payload_json: JSON.stringify({ id })
          });
          await refreshData();
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Subscriptions Hub</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.selectionAsync();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Totals Summary Banner */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.sumLabel, { color: colors.textMuted }]}>Monthly Total</Text>
            <Text style={[styles.sumVal, { color: colors.textPrimary }]}>{formatPaise(monthlyTotalPaise)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.sumLabel, { color: colors.textMuted }]}>Annual Total</Text>
            <Text style={[styles.sumVal, { color: colors.accent }]}>{formatPaise(annualTotalPaise)}</Text>
          </View>
        </View>

        {activeSubs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="tv-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No active subscriptions tracked</Text>
          </View>
        ) : (
          activeSubs.map(s => (
            <View key={s.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="tv" size={20} color={colors.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.subName, { color: colors.textPrimary }]}>{s.name}</Text>
                <Text style={[styles.subCycle, { color: colors.textMuted }]}>
                  Next bill: {s.next_billing_date} ({s.billing_cycle})
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.subAmount, { color: colors.textPrimary }]}>
                  {formatPaise(s.amount_paise)}/{s.billing_cycle === 'annual' ? 'yr' : 'mo'}
                </Text>
                <Pressable onPress={() => handleDeleteSub(s.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Subscription Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Subscription</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Subscription Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. Netflix, Spotify, iCloud"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount (INR)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. 649"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Billing Cycle</Text>
            <View style={styles.cycleRow}>
              {(['monthly', 'annual'] as const).map(c => (
                <Pressable
                  key={c}
                  style={[
                    styles.cycleChip,
                    { backgroundColor: billingCycle === c ? colors.accent : colors.inputBg }
                  ]}
                  onPress={() => setBillingCycle(c)}
                >
                  <Text style={{ color: billingCycle === c ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleCreateSub}>
              <Text style={styles.saveBtnText}>Save Subscription</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sumVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#94A3B833',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
  },
  subCycle: {
    fontSize: 12,
    marginTop: 2,
  },
  subAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cycleChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
