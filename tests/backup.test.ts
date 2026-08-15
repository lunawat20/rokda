// ROKDA BACKUP & RESTORE INTEGRITY TESTS

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/dir/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' }
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/database/repository', () => ({
  getAccounts: jest.fn().mockResolvedValue([]),
  getCategories: jest.fn().mockResolvedValue([]),
  getTransactions: jest.fn().mockResolvedValue([]),
  getBudgets: jest.fn().mockResolvedValue([]),
  getGoals: jest.fn().mockResolvedValue([]),
  getSubscriptions: jest.fn().mockResolvedValue([]),
  getRecurringTransactions: jest.fn().mockResolvedValue([]),
  saveAccount: jest.fn().mockResolvedValue(true),
  saveCategory: jest.fn().mockResolvedValue(true),
  saveTransaction: jest.fn().mockResolvedValue(true),
  saveBudget: jest.fn().mockResolvedValue(true),
  saveGoal: jest.fn().mockResolvedValue(true),
  saveSubscription: jest.fn().mockResolvedValue(true),
  saveRecurringTransaction: jest.fn().mockResolvedValue(true)
}));

import { validateBackupContent } from '../src/services/backup';

describe('Local JSON Backup & Restore Engine', () => {
  test('Valid backup file passes verification', () => {
    const mockBackupPayload = {
      backup_version: 1,
      app_version: '1.0.0',
      created_at: '2026-08-15T12:00:00Z',
      user_id: 'user_123',
      data: {
        accounts: [{ id: 'acc_1' }],
        categories: [{ id: 'cat_1' }],
        transactions: [{ id: 'tx_1' }, { id: 'tx_2' }],
        budgets: [],
        goals: [],
        subscriptions: [],
        recurring_transactions: []
      }
    };

    const jsonStr = JSON.stringify(mockBackupPayload);
    const result = validateBackupContent(jsonStr);

    expect(result.isValid).toBe(true);
    expect(result.recordCounts.transactions).toBe(2);
    expect(result.recordCounts.accounts).toBe(1);
  });

  test('Invalid JSON returns validation error', () => {
    const result = validateBackupContent('{ invalid json content ');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Failed to parse backup JSON');
  });
});
