// ROKDA DATA TYPES

export type AccountType = 
  | 'cash'
  | 'bank'
  | 'savings'
  | 'credit_card'
  | 'wallet'
  | 'investment'
  | 'loan'
  | 'custom';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance_paise: number; // Integer minor units (1 INR = 100 paise)
  current_balance_paise: number;
  currency_code: string;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parent_id?: string | null;
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  user_id: string;
  amount_paise: number;
  type: TransactionType;
  category_id?: string | null;
  account_id: string;
  destination_account_id?: string | null;
  merchant: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  notes: string;
  is_recurring: boolean;
  recurring_id?: string | null;
  receipt_uri?: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export interface TransactionSplit {
  id: string;
  user_id: string;
  transaction_id: string;
  category_id: string;
  amount_paise: number;
  notes: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  period: 'monthly' | 'custom';
  amount_paise: number;
  start_date: string;
  rollover_enabled: boolean;
  alert_threshold_percent: number;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount_paise: number;
  current_amount_paise: number;
  target_date: string;
  monthly_contribution_paise: number;
  account_id?: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount_paise: number;
  billing_cycle: 'monthly' | 'annual';
  next_billing_date: string;
  category_id?: string | null;
  account_id?: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export type RecurringFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount_paise: number;
  type: TransactionType;
  category_id?: string | null;
  account_id: string;
  destination_account_id?: string | null;
  frequency: RecurringFrequency;
  next_due_date: string;
  start_date: string;
  end_date?: string | null;
  auto_post: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at?: string | null;
}

export interface UserProfile {
  user_id: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface DashboardPreference {
  section_id: string;
  order_index: number;
  is_visible: boolean;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload_json: string;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  attempt_count: number;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmartInsight {
  id: string;
  type: 'info' | 'warning' | 'positive' | 'tip';
  title: string;
  message: string;
  category_id?: string;
  actionable?: boolean;
}

export interface FinancialHealthMetrics {
  savings_rate_percent: number;
  budget_adherence_percent: number;
  recurring_commitments_paise: number;
  emergency_fund_months: number;
  debt_total_paise: number;
  net_worth_paise: number;
}
