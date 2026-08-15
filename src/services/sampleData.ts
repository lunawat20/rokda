// ROKDA SAMPLE DATA GENERATOR (DEVELOPMENT & DEMO TESTING)
// Generates rich user-scoped fictional financial data (salary, groceries, rent, trip goal, subscriptions).

import { saveTransaction, saveBudget, saveGoal, saveSubscription, saveRecurringTransaction } from '../database/repository';
import { Transaction, Budget, Goal, Subscription, RecurringTransaction } from '../types';

export async function populateSampleData(userId: string): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  const firstOfMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;

  // 1. Sample Transactions
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_sample_salary',
      user_id: userId,
      amount_paise: 8500000, // +₹85,000.00
      type: 'income',
      category_id: 'cat_salary',
      account_id: 'acc_bank_main',
      merchant: 'Acme Corp Tech Pvt Ltd',
      date: firstOfMonthStr,
      time: '09:00:00',
      notes: 'Monthly Salary Credit',
      is_recurring: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'tx_sample_rent',
      user_id: userId,
      amount_paise: 2500000, // -₹25,000.00
      type: 'expense',
      category_id: 'cat_rent',
      account_id: 'acc_bank_main',
      merchant: 'Prestige Apartments Rent',
      date: firstOfMonthStr,
      time: '10:30:00',
      notes: 'Apartment Monthly Rent',
      is_recurring: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'tx_sample_groceries',
      user_id: userId,
      amount_paise: 345000, // -₹3,450.00
      type: 'expense',
      category_id: 'cat_groceries',
      account_id: 'acc_credit_card',
      merchant: 'Blinkit Supermarket',
      date: threeDaysAgoStr,
      time: '18:20:00',
      notes: 'Weekly Groceries & Vegetables',
      is_recurring: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'tx_sample_starbucks',
      user_id: userId,
      amount_paise: 48000, // -₹480.00
      type: 'expense',
      category_id: 'cat_coffee',
      account_id: 'acc_cash',
      merchant: 'Starbucks Coffee',
      date: yesterdayStr,
      time: '16:45:00',
      notes: 'Cappuccino & Muffin',
      is_recurring: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'tx_sample_amazon',
      user_id: userId,
      amount_paise: 249900, // -₹2,499.00
      type: 'expense',
      category_id: 'cat_electronics',
      account_id: 'acc_credit_card',
      merchant: 'Amazon India',
      date: todayStr,
      time: '14:15:00',
      notes: 'Wireless Noise Canceling Earbuds',
      is_recurring: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }
  ];

  for (const tx of sampleTransactions) {
    await saveTransaction(tx);
  }

  // 2. Sample Budgets
  const sampleBudgets: Budget[] = [
    {
      id: 'b_sample_food',
      user_id: userId,
      category_id: 'cat_food',
      period: 'monthly',
      amount_paise: 1200000, // ₹12,000.00 budget
      start_date: firstOfMonthStr,
      rollover_enabled: false,
      alert_threshold_percent: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'b_sample_shopping',
      user_id: userId,
      category_id: 'cat_shopping',
      period: 'monthly',
      amount_paise: 800000, // ₹8,000.00 budget
      start_date: firstOfMonthStr,
      rollover_enabled: true,
      alert_threshold_percent: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }
  ];

  for (const b of sampleBudgets) {
    await saveBudget(b);
  }

  // 3. Sample Goals
  const sampleGoals: Goal[] = [
    {
      id: 'g_sample_japan',
      user_id: userId,
      name: 'Japan Vacation Trip',
      target_amount_paise: 15000000, // ₹1,50,000.00
      current_amount_paise: 5500000,  // ₹55,000.00 (36.6%)
      target_date: '2026-11-30',
      monthly_contribution_paise: 1500000,
      account_id: 'acc_bank_main',
      icon: 'airplane',
      color: '#EC4899',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'g_sample_emergency',
      user_id: userId,
      name: 'Emergency Fund',
      target_amount_paise: 30000000, // ₹3,00,000.00
      current_amount_paise: 18000000, // ₹1,80,000.00 (60%)
      target_date: '2027-03-31',
      monthly_contribution_paise: 2000000,
      account_id: 'acc_bank_main',
      icon: 'shield-checkmark',
      color: '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }
  ];

  for (const g of sampleGoals) {
    await saveGoal(g);
  }

  // 4. Sample Subscriptions
  const sampleSubscriptions: Subscription[] = [
    {
      id: 'sub_netflix',
      user_id: userId,
      name: 'Netflix Premium 4K',
      amount_paise: 64900, // ₹649/mo
      billing_cycle: 'monthly',
      next_billing_date: '2026-08-25',
      category_id: 'cat_streaming',
      account_id: 'acc_credit_card',
      icon: 'tv',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    },
    {
      id: 'sub_spotify',
      user_id: userId,
      name: 'Spotify Premium Duo',
      amount_paise: 14900, // ₹149/mo
      billing_cycle: 'monthly',
      next_billing_date: '2026-08-28',
      category_id: 'cat_streaming',
      account_id: 'acc_credit_card',
      icon: 'musical-notes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }
  ];

  for (const sub of sampleSubscriptions) {
    await saveSubscription(sub);
  }
}
