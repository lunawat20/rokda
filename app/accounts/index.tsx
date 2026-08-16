// ROKDA ACCOUNTS MANAGER SCREEN (WITH KEYBOARD AVOIDING VIEW & QUICK ADD)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { formatPaise, parseInputToPaise } from '../../src/utils/currency';
import { saveAccount, enqueueSyncItem } from '../../src/database/repository';
import { Account, AccountType } from '../../src/types';

export default function AccountsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { accounts, refreshData } = useDb();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balanceInput, setBalanceInput] = useState('');

  const accountTypes: { label: string; value: AccountType; icon: string }[] = [
    { label: 'Bank Account', value: 'bank', icon: 'card' },
    { label: 'Cash in Hand', value: 'cash', icon: 'cash' },
    { label: 'Credit Card', value: 'credit_card', icon: 'card-outline' },
    { label: 'Savings', value: 'savings', icon: 'shield-checkmark' },
    { label: 'Investment', value: 'investment', icon: 'trending-up' },
    { label: 'Loan / Debt', value: 'loan', icon: 'alert-circle' },
  ];

  const handleCreateAccount = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter account name.');
      return;
    }

    const openingPaise = parseInputToPaise(balanceInput);

    const newAcc: Account = {
      id: `acc_${Date.now()}`,
      user_id: user.id,
      name: name.trim(),
      type,
      opening_balance_paise: openingPaise,
      current_balance_paise: openingPaise,
      currency_code: 'INR',
      icon: accountTypes.find(t => t.value === type)?.icon || 'card',
      color: type === 'credit_card' || type === 'loan' ? colors.danger : colors.accent,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    await saveAccount(newAcc);
    await enqueueSyncItem({
      id: `sync_${Date.now()}`,
      user_id: user.id,
      table_name: 'accounts',
      record_id: newAcc.id,
      action: 'INSERT',
      payload_json: JSON.stringify(newAcc)
    });

    await refreshData();
    setModalVisible(false);
    setName('');
    setBalanceInput('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Accounts & Balances</Text>
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
        {accounts.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="card-outline" size={36} color={colors.accent} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Accounts Added Yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Tap the + button above to add your HDFC Bank, ICICI Credit Card, or Cash account.
            </Text>
            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.accent }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.createBtnText}>+ Add First Account</Text>
            </Pressable>
          </View>
        ) : (
          accounts.map(acc => (
            <View key={acc.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.iconCircle, { backgroundColor: acc.color ? `${acc.color}22` : colors.accentLight }]}>
                <Ionicons name={(acc.icon as any) || 'card'} size={20} color={acc.color || colors.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.accName, { color: colors.textPrimary }]}>{acc.name}</Text>
                <Text style={[styles.accType, { color: colors.textMuted }]}>{acc.type.toUpperCase()}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.balanceVal, { color: acc.current_balance_paise < 0 ? colors.danger : colors.textPrimary }]}>
                  {formatPaise(acc.current_balance_paise)}
                </Text>
                <Text style={[styles.openingVal, { color: colors.textMuted }]}>
                  Opening: {formatPaise(acc.opening_balance_paise)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Account Modal with KeyboardAvoidingView */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Account</Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>Account Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="e.g. HDFC Bank, ICICI Card, Cash"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Account Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {accountTypes.map(t => (
                    <Pressable
                      key={t.value}
                      style={[
                        styles.chip,
                        { backgroundColor: type === t.value ? colors.accent : colors.inputBg }
                      ]}
                      onPress={() => setType(t.value)}
                    >
                      <Text style={{ color: type === t.value ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: colors.textSecondary }]}>Opening Balance (INR)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                  placeholder="e.g. 25000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={balanceInput}
                  onChangeText={setBalanceInput}
                />

                <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleCreateAccount}>
                  <Text style={styles.saveBtnText}>Save Account</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
  emptyBox: { padding: 30, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  createBtn: { paddingHorizontal: 20, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  accName: { fontSize: 15, fontWeight: '700' },
  accType: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  balanceVal: { fontSize: 16, fontWeight: '800' },
  openingVal: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  chipScroll: { flexDirection: 'row', marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
