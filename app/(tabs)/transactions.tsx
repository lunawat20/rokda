// ROKDA TRANSACTIONS TIMELINE & SEARCH SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useDb } from '../../src/context/DbContext';
import { Transaction } from '../../src/types';
import { formatPaise } from '../../src/utils/currency';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { transactions, categories, accounts } = useDb();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const catMap = new Map(categories.map(c => [c.id, c]));
  const accMap = new Map(accounts.map(a => [a.id, a]));

  // Filter transactions
  const filteredTx = transactions.filter(t => {
    if (t.deleted_at) return false;
    if (selectedType && t.type !== selectedType) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const merchantMatch = t.merchant.toLowerCase().includes(q);
      const notesMatch = t.notes.toLowerCase().includes(q);
      const catMatch = t.category_id ? (catMap.get(t.category_id)?.name.toLowerCase().includes(q) ?? false) : false;
      const accMatch = accMap.get(t.account_id)?.name.toLowerCase().includes(q) ?? false;
      const amountMatch = (t.amount_paise / 100).toString().includes(q);
      return merchantMatch || notesMatch || catMatch || accMatch || amountMatch;
    }

    return true;
  });

  // Group transactions by date
  const groupedMap = new Map<string, Transaction[]>();
  filteredTx.forEach(tx => {
    const list = groupedMap.get(tx.date) || [];
    list.push(tx);
    groupedMap.set(tx.date, list);
  });

  const sections = Array.from(groupedMap.entries()).map(([date, items]) => ({
    date,
    items
  }));

  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'TODAY';
    if (dateStr === yest) return 'YESTERDAY';
    return dateStr;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Transactions</Text>

        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search merchant, category, notes..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.filterBtn, { backgroundColor: selectedType ? colors.accentLight : colors.inputBg, borderColor: colors.cardBorder }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color={selectedType ? colors.accent : colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Timeline List */}
      <FlatList
        data={sections}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions found</Text>
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.sectionContainer}>
            <Text style={[styles.dateHeader, { color: colors.textMuted }]}>{formatDateHeader(section.date)}</Text>
            {section.items.map(tx => {
              const cat = tx.category_id ? catMap.get(tx.category_id) : null;
              const acc = accMap.get(tx.account_id);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              return (
                <Pressable
                  key={tx.id}
                  style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/transaction/${tx.id}`);
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: cat?.color ? `${cat.color}22` : colors.accentLight }]}>
                    <Ionicons name={(cat?.icon as any) || 'swap-horizontal'} size={20} color={cat?.color || colors.accent} />
                  </View>

                  <View style={styles.txMainInfo}>
                    <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {tx.merchant}
                    </Text>
                    <Text style={[styles.txSubText, { color: colors.textSecondary }]}>
                      {cat?.name || 'Transfer'} • {acc?.name || 'Account'}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      { color: isExpense ? colors.danger : isIncome ? colors.success : colors.textPrimary }
                    ]}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}{formatPaise(tx.amount_paise)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />

      {/* Quick Add Floating FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.push('/transaction/new');
        }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>

      {/* Filter Options Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filter Transactions</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.filterGroupTitle, { color: colors.textSecondary }]}>Transaction Type</Text>
            <View style={styles.filterOptionsRow}>
              {[
                { label: 'All', value: null },
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
                { label: 'Transfer', value: 'transfer' },
              ].map(opt => (
                <Pressable
                  key={opt.label}
                  style={[
                    styles.chip,
                    { backgroundColor: selectedType === opt.value ? colors.accent : colors.inputBg }
                  ]}
                  onPress={() => setSelectedType(opt.value)}
                >
                  <Text style={{ color: selectedType === opt.value ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.applyBtn, { backgroundColor: colors.accent }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMainInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  txSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    gap: 16,
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
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
