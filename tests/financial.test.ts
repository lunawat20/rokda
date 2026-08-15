// ROKDA FINANCIAL DOMAIN & PAISE PRECISION UNIT TESTS

import { currencyToPaise, paiseToCurrency, formatPaise, formatPaiseCompact } from '../src/utils/currency';
import { calculateAccountBalances, validateSplitTotals, calculateCashFlow, calculateBudgetHealth } from '../src/services/financial';
import { Account, Transaction, Budget } from '../src/types';

describe('Financial Domain Logic & Paise Precision', () => {
  test('Paise precision conversions eliminate floating-point rounding errors', () => {
    expect(currencyToPaise(100.50)).toBe(10050);
    expect(paiseToCurrency(10050)).toBe(100.50);
    expect(currencyToPaise(124580.75)).toBe(12458075);
  });

  test('formatPaise produces standard Indian Rupee notation', () => {
    expect(formatPaise(12458000)).toBe('₹1,24,580');
    expect(formatPaise(12458050, { showDecimal: true })).toBe('₹1,24,580.50');
    expect(formatPaise(-50000)).toBe('-₹500');
  });

  test('formatPaiseCompact formats large currency numbers concisely', () => {
    expect(formatPaiseCompact(38400000)).toBe('₹3.84L');
    expect(formatPaiseCompact(1200000000)).toBe('₹1.20Cr');
  });

  test('Account balance mutation contract updates balances correctly', () => {
    const mockAccounts: Account[] = [
      { id: 'acc_1', user_id: 'user_1', name: 'Cash', type: 'cash', opening_balance_paise: 10000, current_balance_paise: 10000, currency_code: 'INR', icon: 'cash', color: '#000', is_archived: false, created_at: '', updated_at: '', version: 1 },
      { id: 'acc_2', user_id: 'user_1', name: 'Bank', type: 'bank', opening_balance_paise: 50000, current_balance_paise: 50000, currency_code: 'INR', icon: 'card', color: '#000', is_archived: false, created_at: '', updated_at: '', version: 1 }
    ];

    const mockTransactions: Transaction[] = [
      { id: 'tx_1', user_id: 'user_1', amount_paise: 2000, type: 'expense', account_id: 'acc_1', merchant: 'Food', date: '2026-08-15', time: '12:00:00', notes: '', is_recurring: false, created_at: '', updated_at: '', version: 1 },
      { id: 'tx_2', user_id: 'user_1', amount_paise: 10000, type: 'income', account_id: 'acc_2', merchant: 'Salary', date: '2026-08-15', time: '12:00:00', notes: '', is_recurring: false, created_at: '', updated_at: '', version: 1 },
      { id: 'tx_3', user_id: 'user_1', amount_paise: 5000, type: 'transfer', account_id: 'acc_2', destination_account_id: 'acc_1', merchant: 'ATM Withdrawal', date: '2026-08-15', time: '12:00:00', notes: '', is_recurring: false, created_at: '', updated_at: '', version: 1 }
    ];

    const balances = calculateAccountBalances(mockAccounts, mockTransactions);

    // Cash: 10000 - 2000 (expense) + 5000 (transfer in) = 13000
    expect(balances.get('acc_1')).toBe(13000);
    // Bank: 50000 + 10000 (income) - 5000 (transfer out) = 55000
    expect(balances.get('acc_2')).toBe(55000);
  });

  test('Split transaction total invariant validator enforces sum equality', () => {
    const valid = validateSplitTotals(5000, [{ amount_paise: 3500 }, { amount_paise: 1500 }]);
    expect(valid.isValid).toBe(true);
    expect(valid.differencePaise).toBe(0);

    const invalid = validateSplitTotals(5000, [{ amount_paise: 3500 }, { amount_paise: 1000 }]);
    expect(invalid.isValid).toBe(false);
    expect(invalid.differencePaise).toBe(500);
  });

  test('Budget health calculator computes percent used and forecast pace', () => {
    const mockBudget: Budget = {
      id: 'b_1', user_id: 'u_1', category_id: 'cat_food', period: 'monthly', amount_paise: 10000, start_date: '2026-08-01', rollover_enabled: false, alert_threshold_percent: 80, created_at: '', updated_at: '', version: 1
    };

    const mockTxs: Transaction[] = [
      { id: 't_1', user_id: 'u_1', amount_paise: 6000, type: 'expense', category_id: 'cat_food', account_id: 'acc_1', merchant: 'Food', date: '2026-08-15', time: '12:00:00', notes: '', is_recurring: false, created_at: '', updated_at: '', version: 1 }
    ];

    const health = calculateBudgetHealth(mockBudget, mockTxs, 30, 15);
    expect(health.spentPaise).toBe(6000);
    expect(health.remainingPaise).toBe(4000);
    expect(health.percentUsed).toBe(60);
    expect(health.status).toBe('healthy');
  });
});
