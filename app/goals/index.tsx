// ROKDA SAVINGS GOALS MANAGER SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, parseInputToPaise } from '../../src/utils/currency';
import { saveGoal, deleteGoal, enqueueSyncItem } from '../../src/database/repository';
import { Goal } from '../../src/types';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { goals, refreshData } = useDb();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [targetDate, setTargetDate] = useState('2027-12-31');

  const activeGoals = goals.filter(g => !g.deleted_at);

  const handleCreateGoal = async () => {
    if (!user) return;
    if (!name.trim() || !targetInput) {
      Alert.alert('Missing Fields', 'Please enter goal name and target amount.');
      return;
    }

    const targetPaise = parseInputToPaise(targetInput);
    const currentPaise = parseInputToPaise(currentInput || '0');

    const newGoal: Goal = {
      id: `g_${Date.now()}`,
      user_id: user.id,
      name: name.trim(),
      target_amount_paise: targetPaise,
      current_amount_paise: currentPaise,
      target_date: targetDate,
      monthly_contribution_paise: Math.round(targetPaise / 12),
      icon: 'flag',
      color: colors.accent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    await saveGoal(newGoal);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'goals',
      record_id: newGoal.id,
      action: 'INSERT',
      payload_json: JSON.stringify(newGoal)
    });

    await refreshData();
    setModalVisible(false);
    setName('');
    setTargetInput('');
    setCurrentInput('');
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    Alert.alert('Delete Goal', 'Are you sure you want to delete this savings goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(id);
          await enqueueSyncItem({
            id: `sync_${Date.now()}`,
            user_id: user.id,
            table_name: 'goals',
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Savings Goals</Text>
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
        {activeGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No active savings goals</Text>
          </View>
        ) : (
          activeGoals.map(g => {
            const pct = Math.min(100, Math.round((g.current_amount_paise / g.target_amount_paise) * 100));

            return (
              <View key={g.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.iconCircle, { backgroundColor: `${g.color || colors.accent}22` }]}>
                      <Ionicons name={(g.icon as any) || 'flag'} size={18} color={g.color || colors.accent} />
                    </View>
                    <View>
                      <Text style={[styles.goalName, { color: colors.textPrimary }]}>{g.name}</Text>
                      <Text style={[styles.targetDateText, { color: colors.textMuted }]}>Target: {g.target_date}</Text>
                    </View>
                  </View>

                  <Pressable onPress={() => handleDeleteGoal(g.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.amountRow}>
                  <Text style={[styles.currentText, { color: colors.textPrimary }]}>{formatPaise(g.current_amount_paise)}</Text>
                  <Text style={[styles.targetText, { color: colors.textSecondary }]}>of {formatPaise(g.target_amount_paise)} ({pct}%)</Text>
                </View>

                <View style={[styles.progressBarBg, { backgroundColor: colors.inputBg }]}>
                  <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: g.color || colors.accent }]} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Savings Goal</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Goal Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. Emergency Fund, Japan Trip"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Target Amount (INR)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. 150000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={targetInput}
              onChangeText={setTargetInput}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Initial Saved Amount (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. 25000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={currentInput}
              onChangeText={setCurrentInput}
            />

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleCreateGoal}>
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: 15, fontWeight: '700' },
  targetDateText: { fontSize: 11, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  currentText: { fontSize: 18, fontWeight: '800' },
  targetText: { fontSize: 13 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
