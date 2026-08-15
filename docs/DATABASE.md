# ROKDA DATABASE & SCHEMA SPECIFICATION

Rokda uses a normalized database schema designed for both **Local SQLite** and **Supabase PostgreSQL**.

---

## 1. Profiles Table (1:1 with Auth User)

- `user_id` (UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE)
- `name` (TEXT)
- `currency_code` (TEXT DEFAULT 'INR')
- `currency_symbol` (TEXT DEFAULT '₹')
- `theme` (TEXT DEFAULT 'system')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 2. Core Operational Tables

Every user-owned table contains composite primary keys `(user_id, id)` and composite foreign key constraints preventing cross-user entity references:

### Accounts (`accounts`)
- `id` (TEXT)
- `user_id` (UUID REFERENCES auth.users(id))
- `name` (TEXT)
- `type` (TEXT) -- `cash`, `bank`, `savings`, `credit_card`, `wallet`, `investment`, `loan`, `custom`
- `opening_balance_paise` (BIGINT)
- `current_balance_paise` (BIGINT)
- `currency_code` (TEXT)
- `icon` (TEXT)
- `color` (TEXT)
- `is_archived` (BOOLEAN)
- `version` (INT)
- `deleted_at` (TIMESTAMPTZ NULL)

### Transactions (`transactions`)
- `id` (TEXT)
- `user_id` (UUID REFERENCES auth.users(id))
- `amount_paise` (BIGINT)
- `type` (TEXT) -- `expense`, `income`, `transfer`
- `category_id` (TEXT)
- `account_id` (TEXT)
- `destination_account_id` (TEXT NULL)
- `merchant` (TEXT)
- `date` (TEXT) -- YYYY-MM-DD
- `time` (TEXT) -- HH:MM:SS
- `notes` (TEXT)
- `is_recurring` (BOOLEAN)
- `recurring_id` (TEXT NULL)
- `receipt_uri` (TEXT NULL)
- `version` (INT)
- `deleted_at` (TIMESTAMPTZ NULL)

**Composite Constraints**:
- `CONSTRAINT fk_tx_account FOREIGN KEY (user_id, account_id) REFERENCES accounts(user_id, id)`
- `CONSTRAINT fk_tx_dest_account FOREIGN KEY (user_id, destination_account_id) REFERENCES accounts(user_id, id)`
- `CONSTRAINT fk_tx_category FOREIGN KEY (user_id, category_id) REFERENCES categories(user_id, id)`
