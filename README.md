# ROKDA — PRODUCTION-QUALITY MULTI-USER PERSONAL MONEY MANAGER FOR iOS

Rokda is a local-first, privacy-first, multi-user personal money management application built using **React Native**, **Expo**, **TypeScript**, **Expo Router**, **Expo SQLite**, and **Supabase (Auth, PostgreSQL, & Row Level Security)**.

---

## Features

- **5 Main Tabs**: Home (Dashboard), Transactions, Budgets, Insights, and More.
- **Local-First & Offline-First**: 100% operational offline via user-isolated SQLite databases (`rokda_user_{user_id}.db`).
- **Paise Precision**: All monetary values stored as 64-bit integers in minor units (paise) to eliminate floating-point rounding errors.
- **Multi-User Isolation**: Supabase Auth + 1:1 Profiles + Composite Foreign Keys `(user_id, target_id)` + Complete RLS Audit.
- **Atomic Optimistic Concurrency Engine**: PostgreSQL stored RPC functions (`sync_upsert_*`) with `FOR UPDATE` row locks, version checks, and tombstone deletion handling.
- **Face ID Security**: Native `LocalAuthentication` app lock with configurable timeouts (`immediately`, `1min`, `5min`, `never`).
- **Accounts**: Cash, Bank, Savings, Credit Card, Wallet, Investment, Loan, Custom.
- **Quick-Add Transaction Flow**: Expense, Income, Transfer with intelligent category & account defaults.
- **Split Transactions**: Multi-category split editor with total equality verification.
- **Budgets**: Category progress bars, health statuses (healthy, approaching >80%, exceeded >100%), and spending pace forecasts.
- **Savings Goals**: Target amounts, projected completion dates, and contribution tracking.
- **Subscriptions & Recurring Payments**: Dedicated hub calculating monthly & annual totals.
- **Cash Flow & Net Worth**: Income vs expense trends, assets vs liabilities.
- **Financial Health Score**: Savings rate %, emergency fund coverage in months, recurring commitments.
- **Monthly Review**: browsable archive of monthly closes.
- **Local JSON Backup & Restore**: SHA-256 integrity checksum, schema validation, diff preview, and native iOS Files share.
- **CSV Exporter**: Generate standard CSV logs via native iOS share sheet.
- **Dark Mode**: Native iOS Light/Dark theme switching.

---

## Technical Documentation

Detailed docs are available in `docs/`:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DATABASE.md`](docs/DATABASE.md)
- [`docs/DATABASE_MIGRATIONS.md`](docs/DATABASE_MIGRATIONS.md)
- [`docs/BACKUP_RESTORE.md`](docs/BACKUP_RESTORE.md)
- [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)

---

## How to Run

1. `npm install`
2. `npx expo start`
3. `npm test`
