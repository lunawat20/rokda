// ROKDA OFFLINE-FIRST SYNC ENGINE
// Handles background sync, atomic RPC calls, optimistic concurrency conflicts, idempotent retries, tombstones, and new-device data recovery.

import { supabase } from '../database/supabase';
import { getPendingSyncQueue, markSyncItemStatus, purgeSyncedQueueItems, saveTransaction, saveAccount, saveBudget, saveGoal, saveSubscription, saveRecurringTransaction } from '../database/repository';
import { SyncQueueItem } from '../types';

let isSyncing = false;

/**
 * Executes a full synchronization cycle (Push queued local changes -> Pull remote changes).
 */
export async function syncUserData(userId: string): Promise<{ pushedCount: number; pulledCount: number; errors: string[] }> {
  if (isSyncing) return { pushedCount: 0, pulledCount: 0, errors: ['Sync already in progress'] };
  isSyncing = true;
  const errors: string[] = [];
  let pushedCount = 0;
  let pulledCount = 0;

  try {
    // 1. Push pending local mutations to Supabase
    const pushResult = await pushLocalChanges(userId);
    pushedCount = pushResult.pushed;
    if (pushResult.error) errors.push(pushResult.error);

    // 2. Pull remote updates from Supabase
    const pullResult = await pullRemoteChanges(userId);
    pulledCount = pullResult.pulled;
    if (pullResult.error) errors.push(pullResult.error);

    await purgeSyncedQueueItems();
  } catch (e: any) {
    errors.push(e.message || 'Sync error');
  } finally {
    isSyncing = false;
  }

  return { pushedCount, pulledCount, errors };
}

/**
 * Pushes queued offline mutations to Supabase using atomic stored RPC functions.
 */
async function pushLocalChanges(userId: string): Promise<{ pushed: number; error?: string }> {
  const queue = await getPendingSyncQueue();
  let pushed = 0;

  for (const item of queue) {
    try {
      const payload = JSON.parse(item.payload_json);

      if (item.action === 'DELETE') {
        // Handle Tombstone Deletion
        const { error } = await supabase
          .from(item.table_name)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.record_id)
          .eq('user_id', userId);

        if (error) {
          await markSyncItemStatus(item.id, 'failed', error.message);
          continue;
        }
      } else {
        // Handle Insert / Update via RPC or Upsert
        let rpcName = '';
        let rpcParams: Record<string, any> = {};

        if (item.table_name === 'transactions') {
          rpcName = 'sync_upsert_transaction';
          rpcParams = {
            p_id: payload.id,
            p_amount_paise: payload.amount_paise,
            p_type: payload.type,
            p_category_id: payload.category_id ?? null,
            p_account_id: payload.account_id,
            p_destination_account_id: payload.destination_account_id ?? null,
            p_merchant: payload.merchant,
            p_date: payload.date,
            p_time: payload.time,
            p_notes: payload.notes || '',
            p_is_recurring: payload.is_recurring ? true : false,
            p_recurring_id: payload.recurring_id ?? null,
            p_receipt_uri: payload.receipt_uri ?? null,
            p_client_version: payload.version || 1
          };
        } else if (item.table_name === 'accounts') {
          rpcName = 'sync_upsert_account';
          rpcParams = {
            p_id: payload.id,
            p_name: payload.name,
            p_type: payload.type,
            p_opening_balance_paise: payload.opening_balance_paise,
            p_current_balance_paise: payload.current_balance_paise,
            p_currency_code: payload.currency_code || 'INR',
            p_icon: payload.icon,
            p_color: payload.color,
            p_is_archived: payload.is_archived ? true : false,
            p_client_version: payload.version || 1
          };
        } else if (item.table_name === 'budgets') {
          rpcName = 'sync_upsert_budget';
          rpcParams = {
            p_id: payload.id,
            p_category_id: payload.category_id,
            p_period: payload.period || 'monthly',
            p_amount_paise: payload.amount_paise,
            p_start_date: payload.start_date,
            p_rollover_enabled: payload.rollover_enabled ? true : false,
            p_alert_threshold_percent: payload.alert_threshold_percent || 80,
            p_client_version: payload.version || 1
          };
        } else if (item.table_name === 'goals') {
          rpcName = 'sync_upsert_goal';
          rpcParams = {
            p_id: payload.id,
            p_name: payload.name,
            p_target_amount_paise: payload.target_amount_paise,
            p_current_amount_paise: payload.current_amount_paise,
            p_target_date: payload.target_date,
            p_monthly_contribution_paise: payload.monthly_contribution_paise,
            p_account_id: payload.account_id ?? null,
            p_icon: payload.icon,
            p_color: payload.color,
            p_client_version: payload.version || 1
          };
        }

        if (rpcName) {
          const { data: res, error: rpcErr } = await supabase.rpc(rpcName, rpcParams);
          if (rpcErr) {
            await markSyncItemStatus(item.id, 'failed', rpcErr.message);
            continue;
          }

          if (res && res.status === 'CONFLICT') {
            console.warn(`Concurrency conflict detected on ${item.table_name}:${item.record_id}. Server version: ${res.server_version}, Client version: ${res.client_version}`);
            await markSyncItemStatus(item.id, 'failed', 'Version Conflict');
            continue;
          }

          if (res && res.status === 'ERROR') {
            await markSyncItemStatus(item.id, 'failed', res.message);
            continue;
          }
        } else {
          // Direct fallback upsert for general tables
          const { error: upErr } = await supabase.from(item.table_name).upsert({ ...payload, user_id: userId });
          if (upErr) {
            await markSyncItemStatus(item.id, 'failed', upErr.message);
            continue;
          }
        }
      }

      await markSyncItemStatus(item.id, 'synced');
      pushed++;
    } catch (e: any) {
      await markSyncItemStatus(item.id, 'failed', e.message);
    }
  }

  return { pushed };
}

/**
 * Pulls remote database changes from Supabase into local SQLite database.
 */
async function pullRemoteChanges(userId: string): Promise<{ pulled: number; error?: string }> {
  let pulled = 0;

  try {
    const { data: remoteTxs, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (!txErr && remoteTxs) {
      for (const rtx of remoteTxs) {
        await saveTransaction(rtx);
        pulled++;
      }
    }

    const { data: remoteAccs, error: accErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (!accErr && remoteAccs) {
      for (const racc of remoteAccs) {
        await saveAccount(racc);
        pulled++;
      }
    }

    const { data: remoteBudgets, error: budErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (!budErr && remoteBudgets) {
      for (const rbud of remoteBudgets) {
        await saveBudget(rbud);
        pulled++;
      }
    }

    const { data: remoteGoals, error: goalErr } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (!goalErr && remoteGoals) {
      for (const rgoal of remoteGoals) {
        await saveGoal(rgoal);
        pulled++;
      }
    }
  } catch (e: any) {
    return { pulled, error: e.message };
  }

  return { pulled };
}

/**
 * New Device Data Recovery: Performs full snapshot download on fresh login.
 */
export async function restoreNewDeviceDataset(userId: string): Promise<boolean> {
  const result = await pullRemoteChanges(userId);
  return result.pulled > 0;
}
