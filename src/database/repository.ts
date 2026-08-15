// LOCAL SQLITE REPOSITORY OPERATIONAL STORE

import { getDatabaseForUser, requireActiveDatabase } from './db';
import { Account, Category, Transaction, TransactionSplit, Budget, Goal, Subscription, RecurringTransaction, SyncQueueItem, DashboardPreference } from '../types';
import { SYSTEM_CATEGORIES, DEFAULT_ACCOUNTS, DEFAULT_DASHBOARD_SECTIONS } from '../constants/defaults';

/**
 * Initializes default system categories, default accounts, and dashboard preferences if empty.
 */
export async function initializeUserDefaults(userId: string): Promise<void> {
  const db = await getDatabaseForUser(userId);
  const now = new Date().toISOString();

  // 1. Initialize System Categories
  const existingCats = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!existingCats[0] || existingCats[0].count === 0) {
    for (const cat of SYSTEM_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (id, user_id, name, type, icon, color, parent_id, is_archived, is_system, created_at, updated_at, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [cat.id, userId, cat.name, cat.type, cat.icon, cat.color, cat.parent_id ?? null, cat.is_archived ? 1 : 0, cat.is_system ? 1 : 0, now, now]
      );
    }
  }

  // 2. Initialize Default Accounts
  const existingAccs = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  if (!existingAccs[0] || existingAccs[0].count === 0) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await db.runAsync(
        `INSERT INTO accounts (id, user_id, name, type, opening_balance_paise, current_balance_paise, currency_code, icon, color, is_archived, created_at, updated_at, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [acc.id, userId, acc.name, acc.type, acc.opening_balance_paise, acc.current_balance_paise, acc.currency_code, acc.icon, acc.color, acc.is_archived ? 1 : 0, now, now]
      );
    }
  }

  // 3. Initialize Dashboard Preferences
  const existingPrefs = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM dashboard_preferences');
  if (!existingPrefs[0] || existingPrefs[0].count === 0) {
    for (const pref of DEFAULT_DASHBOARD_SECTIONS) {
      await db.runAsync(
        `INSERT INTO dashboard_preferences (user_id, section_id, order_index, is_visible)
         VALUES (?, ?, ?, ?)`,
        [userId, pref.section_id, pref.order_index, pref.is_visible ? 1 : 0]
      );
    }
  }
}

// ==========================================
// ACCOUNTS
// ==========================================
export async function getAccounts(): Promise<Account[]> {
  const db = requireActiveDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY name ASC');
  return rows.map(r => ({
    ...r,
    is_archived: Boolean(r.is_archived)
  }));
}

export async function saveAccount(acc: Account): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO accounts (id, user_id, name, type, opening_balance_paise, current_balance_paise, currency_code, icon, color, is_archived, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = EXCLUDED.name,
       type = EXCLUDED.type,
       opening_balance_paise = EXCLUDED.opening_balance_paise,
       current_balance_paise = EXCLUDED.current_balance_paise,
       currency_code = EXCLUDED.currency_code,
       icon = EXCLUDED.icon,
       color = EXCLUDED.color,
       is_archived = EXCLUDED.is_archived,
       updated_at = EXCLUDED.updated_at,
       version = accounts.version + 1`,
    [acc.id, acc.user_id, acc.name, acc.type, acc.opening_balance_paise, acc.current_balance_paise, acc.currency_code, acc.icon, acc.color, acc.is_archived ? 1 : 0, acc.created_at || now, now, acc.version || 1, acc.deleted_at ?? null]
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE accounts SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

// ==========================================
// CATEGORIES
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const db = requireActiveDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC');
  return rows.map(r => ({
    ...r,
    is_archived: Boolean(r.is_archived),
    is_system: Boolean(r.is_system)
  }));
}

export async function saveCategory(cat: Category): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, type, icon, color, parent_id, is_archived, is_system, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = EXCLUDED.name,
       icon = EXCLUDED.icon,
       color = EXCLUDED.color,
       parent_id = EXCLUDED.parent_id,
       is_archived = EXCLUDED.is_archived,
       updated_at = EXCLUDED.updated_at,
       version = categories.version + 1`,
    [cat.id, cat.user_id, cat.name, cat.type, cat.icon, cat.color, cat.parent_id ?? null, cat.is_archived ? 1 : 0, cat.is_system ? 1 : 0, cat.created_at || now, now, cat.version || 1, cat.deleted_at ?? null]
  );
}

// ==========================================
// TRANSACTIONS & SPLITS
// ==========================================
export async function getTransactions(): Promise<Transaction[]> {
  const db = requireActiveDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY date DESC, time DESC');
  return rows.map(r => ({
    ...r,
    is_recurring: Boolean(r.is_recurring)
  }));
}

export async function saveTransaction(tx: Transaction, splits: TransactionSplit[] = []): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, user_id, amount_paise, type, category_id, account_id, destination_account_id, merchant, date, time, notes, is_recurring, recurring_id, receipt_uri, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       amount_paise = EXCLUDED.amount_paise,
       type = EXCLUDED.type,
       category_id = EXCLUDED.category_id,
       account_id = EXCLUDED.account_id,
       destination_account_id = EXCLUDED.destination_account_id,
       merchant = EXCLUDED.merchant,
       date = EXCLUDED.date,
       time = EXCLUDED.time,
       notes = EXCLUDED.notes,
       is_recurring = EXCLUDED.is_recurring,
       recurring_id = EXCLUDED.recurring_id,
       receipt_uri = EXCLUDED.receipt_uri,
       updated_at = EXCLUDED.updated_at,
       version = transactions.version + 1`,
    [tx.id, tx.user_id, tx.amount_paise, tx.type, tx.category_id ?? null, tx.account_id, tx.destination_account_id ?? null, tx.merchant, tx.date, tx.time, tx.notes, tx.is_recurring ? 1 : 0, tx.recurring_id ?? null, tx.receipt_uri ?? null, tx.created_at || now, now, tx.version || 1, tx.deleted_at ?? null]
  );

  // Save splits
  if (splits.length > 0) {
    await db.runAsync('DELETE FROM transaction_splits WHERE transaction_id = ?', [tx.id]);
    for (const split of splits) {
      await db.runAsync(
        `INSERT INTO transaction_splits (id, user_id, transaction_id, category_id, amount_paise, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [split.id, split.user_id, tx.id, split.category_id, split.amount_paise, split.notes || '', split.created_at || now]
      );
    }
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

export async function getTransactionSplits(transactionId: string): Promise<TransactionSplit[]> {
  const db = requireActiveDatabase();
  return db.getAllAsync<TransactionSplit>('SELECT * FROM transaction_splits WHERE transaction_id = ? AND deleted_at IS NULL', [transactionId]);
}

// ==========================================
// BUDGETS
// ==========================================
export async function getBudgets(): Promise<Budget[]> {
  const db = requireActiveDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM budgets WHERE deleted_at IS NULL ORDER BY created_at DESC');
  return rows.map(r => ({
    ...r,
    rollover_enabled: Boolean(r.rollover_enabled)
  }));
}

export async function saveBudget(b: Budget): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO budgets (id, user_id, category_id, period, amount_paise, start_date, rollover_enabled, alert_threshold_percent, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       category_id = EXCLUDED.category_id,
       period = EXCLUDED.period,
       amount_paise = EXCLUDED.amount_paise,
       start_date = EXCLUDED.start_date,
       rollover_enabled = EXCLUDED.rollover_enabled,
       alert_threshold_percent = EXCLUDED.alert_threshold_percent,
       updated_at = EXCLUDED.updated_at,
       version = budgets.version + 1`,
    [b.id, b.user_id, b.category_id, b.period, b.amount_paise, b.start_date, b.rollover_enabled ? 1 : 0, b.alert_threshold_percent || 80, b.created_at || now, now, b.version || 1, b.deleted_at ?? null]
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE budgets SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

// ==========================================
// GOALS
// ==========================================
export async function getGoals(): Promise<Goal[]> {
  const db = requireActiveDatabase();
  return db.getAllAsync<Goal>('SELECT * FROM goals WHERE deleted_at IS NULL ORDER BY target_date ASC');
}

export async function saveGoal(g: Goal): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO goals (id, user_id, name, target_amount_paise, current_amount_paise, target_date, monthly_contribution_paise, account_id, icon, color, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = EXCLUDED.name,
       target_amount_paise = EXCLUDED.target_amount_paise,
       current_amount_paise = EXCLUDED.current_amount_paise,
       target_date = EXCLUDED.target_date,
       monthly_contribution_paise = EXCLUDED.monthly_contribution_paise,
       account_id = EXCLUDED.account_id,
       icon = EXCLUDED.icon,
       color = EXCLUDED.color,
       updated_at = EXCLUDED.updated_at,
       version = goals.version + 1`,
    [g.id, g.user_id, g.name, g.target_amount_paise, g.current_amount_paise, g.target_date, g.monthly_contribution_paise, g.account_id ?? null, g.icon, g.color, g.created_at || now, now, g.version || 1, g.deleted_at ?? null]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE goals SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

// ==========================================
// SUBSCRIPTIONS & RECURRING
// ==========================================
export async function getSubscriptions(): Promise<Subscription[]> {
  const db = requireActiveDatabase();
  return db.getAllAsync<Subscription>('SELECT * FROM subscriptions WHERE deleted_at IS NULL ORDER BY next_billing_date ASC');
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO subscriptions (id, user_id, name, amount_paise, billing_cycle, next_billing_date, category_id, account_id, icon, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = EXCLUDED.name,
       amount_paise = EXCLUDED.amount_paise,
       billing_cycle = EXCLUDED.billing_cycle,
       next_billing_date = EXCLUDED.next_billing_date,
       category_id = EXCLUDED.category_id,
       account_id = EXCLUDED.account_id,
       icon = EXCLUDED.icon,
       updated_at = EXCLUDED.updated_at,
       version = subscriptions.version + 1`,
    [sub.id, sub.user_id, sub.name, sub.amount_paise, sub.billing_cycle, sub.next_billing_date, sub.category_id ?? null, sub.account_id ?? null, sub.icon, sub.created_at || now, now, sub.version || 1, sub.deleted_at ?? null]
  );
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE subscriptions SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const db = requireActiveDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM recurring_transactions WHERE deleted_at IS NULL ORDER BY next_due_date ASC');
  return rows.map(r => ({
    ...r,
    auto_post: Boolean(r.auto_post)
  }));
}

export async function saveRecurringTransaction(rec: RecurringTransaction): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO recurring_transactions (id, user_id, title, amount_paise, type, category_id, account_id, destination_account_id, frequency, next_due_date, start_date, end_date, auto_post, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = EXCLUDED.title,
       amount_paise = EXCLUDED.amount_paise,
       type = EXCLUDED.type,
       category_id = EXCLUDED.category_id,
       account_id = EXCLUDED.account_id,
       destination_account_id = EXCLUDED.destination_account_id,
       frequency = EXCLUDED.frequency,
       next_due_date = EXCLUDED.next_due_date,
       start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date,
       auto_post = EXCLUDED.auto_post,
       updated_at = EXCLUDED.updated_at,
       version = recurring_transactions.version + 1`,
    [rec.id, rec.user_id, rec.title, rec.amount_paise, rec.type, rec.category_id ?? null, rec.account_id, rec.destination_account_id ?? null, rec.frequency, rec.next_due_date, rec.start_date, rec.end_date ?? null, rec.auto_post ? 1 : 0, rec.created_at || now, now, rec.version || 1, rec.deleted_at ?? null]
  );
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE recurring_transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

// ==========================================
// SYNC QUEUE
// ==========================================
export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = requireActiveDatabase();
  return db.getAllAsync<SyncQueueItem>('SELECT * FROM sync_queue WHERE status = "pending" OR status = "failed" ORDER BY created_at ASC');
}

export async function enqueueSyncItem(item: Omit<SyncQueueItem, 'status' | 'attempt_count' | 'created_at' | 'updated_at'>): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sync_queue (id, user_id, table_name, record_id, action, payload_json, status, attempt_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    [item.id, item.user_id, item.table_name, item.record_id, item.action, item.payload_json, now, now]
  );
}

export async function markSyncItemStatus(id: string, status: 'synced' | 'failed', errorMsg?: string): Promise<void> {
  const db = requireActiveDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE sync_queue SET status = ?, attempt_count = attempt_count + 1, last_error = ?, updated_at = ? WHERE id = ?',
    [status, errorMsg ?? null, now, id]
  );
}

export async function purgeSyncedQueueItems(): Promise<void> {
  const db = requireActiveDatabase();
  await db.runAsync('DELETE FROM sync_queue WHERE status = "synced"');
}
