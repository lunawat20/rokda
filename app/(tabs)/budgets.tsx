// ROKDA BUDGETS & SPENDING FORECASTS SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, parseInputToPaise } from '../../src/utils/currency';
import { calculateBudgetHealth } from '../../src/services/financial';
import { saveBudget, deleteBudget, enqueueSyncItem } from '../../src/database/repository';
import { Budget } from '../../src/types';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { budgets, categories, transactions, refreshData } = useDb();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [rolloverEnabled, setRolloverEnabled] = useState(false);

  const catMap = new Map(categories.map(c => [c.id, c]));
  const activeBudgets = budgets.filter(b => !b.deleted_at);

  const handleSaveBudget = async () => {
    if (!user) return;
    if (!selectedCategoryId || !amountInput) {
      Alert.alert('Missing Fields', 'Please select a category and enter budget amount.');
      return;
    }

    const amountPaise = parseInputToPaise(amountInput);
    if (amountPaise <= 0) {
      Alert.alert('Invalid Amount', 'Budget amount must be greater than zero.');
      return;
    }

    const newBudget: Budget = {
      id: `b_${Date.now()}`,
      user_id: user.id,
      category_id: selectedCategoryId,
      period: 'monthly',
      amount_paise: amountPaise,
      start_date: new Date().toISOString().split('T')[0],
      rollover_enabled: rolloverEnabled,
      alert_threshold_percent: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    setSelectedCategoryId('');
    setAmountInput('');
  };

  const handleDeleteBudget = async (id: string) => {
    if (!user) return;
    Alert.alert('Delete Budget', 'Are you sure you want to delete this budget?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBudget(id);
          await enqueueSyncItem({
            id: `sync_${Date.now()}`,
            user_id: user.id,
            table_name: 'budgets',
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Category Budgets</Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.selectionAsync();
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Budget</Text>
          </Pressable>
        </View>

        {activeBudgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Active Budgets</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Set up monthly spending limits on your categories to track spending pace.
            </Text>
          </View>
        ) : (
          activeBudgets.map(b => {
            const health = calculateBudgetHealth(b, transactions);
            const cat = catMap.get(b.category_id);

            return (
              <View key={b.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.catTitleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: cat?.color ? `${cat.color}22` : colors.accentLight }]}>
                      <Ionicons name={(cat?.icon as any) || 'pricetag'} size={18} color={cat?.color || colors.accent} />
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat?.name || 'Category'}</Text>
                      <Text style={[styles.statusBadge, { color: health.status === 'exceeded' ? colors.danger : health.status === 'approaching' ? colors.warning : colors.success }]}>
                        {health.status === 'exceeded' ? 'EXCEEDED (100%+)' : health.status === 'approaching' ? 'APPROACHING (80%+)' : 'HEALTHY'}
                      </Text>
                    </View>
                  </View>

                  <Pressable onPress={() => handleDeleteBudget(b.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                {/* Progress Bar */}
                <View style={styles.amountRow}>
                  <Text style={[styles.spentText, { color: colors.textPrimary }]}>{formatPaise(health.spentPaise)}</Text>
                  <Text style={[styles.totalLimitText, { color: colors.textSecondary }]}>of {formatPaise(b.amount_paise)}</Text>
                </View>

                <View style={[styles.progressBarBg, { backgroundColor: colors.inputBg }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, health.percentUsed)}%`,
                        backgroundColor: health.status === 'exceeded' ? colors.danger : health.status === 'approaching' ? colors.warning : colors.success
                      }
                    ]}
                  />
                </View>

                <Text style={[styles.forecastText, { color: colors.textSecondary }]}>
                  Pace Forecast: {health.projectedRemainingPaise >= 0 ? `${formatPaise(health.projectedRemainingPaise)} remaining at end of month` : 'Projected to exceed budget'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Category Budget</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.filter(c => c.type === 'expense').map(c => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.catChip,
                    { backgroundColor: selectedCategoryId === c.id ? colors.accent : colors.inputBg }
                  ]}
                  onPress={() => setSelectedCategoryId(c.id)}
                >
                  <Text style={{ color: selectedCategoryId === c.id ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Monthly Budget Limit (INR)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. 8000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSaveBudget}
            >
              <Text style={styles.saveBtnText}>Save Budget</Text>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  spentText: {
    fontSize: 20,
    fontWeight: '800',
  },
  totalLimitText: {
    fontSize: 14,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  forecastText: {
    fontSize: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  catScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
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
