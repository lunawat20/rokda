// ROKDA LOCAL SQLITE MANAGER
// Enforces 100% local database isolation per authenticated user (rokda_user_{userId}.db).

import * as SQLite from 'expo-sqlite';
import { CREATE_LOCAL_TABLES_SQL, LOCAL_DATABASE_VERSION } from './schema';

let activeDatabase: SQLite.SQLiteDatabase | null = null;
let activeUserId: string | null = null;

/**
 * Opens or retrieves the isolated local SQLite database for the specified user.
 * If another user was previously logged in, closes and unmounts their database connection.
 */
export async function getDatabaseForUser(userId: string): Promise<SQLite.SQLiteDatabase> {
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dbName = `rokda_user_${sanitizedUserId}.db`;

  if (activeDatabase && activeUserId === userId) {
    return activeDatabase;
  }

  if (activeDatabase) {
    await closeCurrentDatabase();
  }

  activeDatabase = await SQLite.openDatabaseAsync(dbName);
  activeUserId = userId;

  // Run Schema DDL initialization
  await activeDatabase.execAsync(CREATE_LOCAL_TABLES_SQL);

  // Check and apply migrations
  await applyLocalMigrations(activeDatabase);

  return activeDatabase;
}

/**
 * Safely closes the active SQLite database connection and clears user state.
 */
export async function closeCurrentDatabase(): Promise<void> {
  if (activeDatabase) {
    try {
      await activeDatabase.closeAsync();
    } catch (e) {
      console.warn('Error closing database:', e);
    }
    activeDatabase = null;
    activeUserId = null;
  }
}

/**
 * Returns currently active user database or throws if unauthenticated / unmounted.
 */
export function requireActiveDatabase(): SQLite.SQLiteDatabase {
  if (!activeDatabase) {
    throw new Error('Database connection not initialized. User must be authenticated.');
  }
  return activeDatabase;
}

async function applyLocalMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getAllAsync<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');
  const currentVersion = result && result.length > 0 ? result[0].version : 0;

  if (currentVersion < LOCAL_DATABASE_VERSION) {
    const now = new Date().toISOString();
    await db.runAsync('INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)', [LOCAL_DATABASE_VERSION, now]);
  }
}
