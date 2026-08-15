# ROKDA DATABASE MIGRATIONS STRATEGY

## Overview
Rokda implements versioned migration strategies for both local SQLite databases and remote Supabase PostgreSQL instances.

---

## 1. Local SQLite Migrations
Local SQLite database schema versions are tracked in the `schema_migrations` table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

When an updated app version launches, `applyLocalMigrations()` checks the current applied version and executes incremental migration scripts idempotently.

---

## 2. Remote PostgreSQL Migrations
Remote PostgreSQL migrations are managed via Supabase CLI migration scripts stored in `supabase/schema.sql` and `supabase/migrations/`.

All schema updates use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` patterns to preserve existing user financial records without downtime or corruption.
