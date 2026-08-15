-- ROKDA SUPABASE MASTER DATABASE SCHEMA
-- Features: 1:1 Profiles, Multi-User Composite FK Isolation, Complete RLS, Atomic Optimistic Concurrency RPCs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_isolation" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- cash|bank|savings|credit_card|wallet|investment|loan|custom
  opening_balance_paise BIGINT NOT NULL DEFAULT 0,
  current_balance_paise BIGINT NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- expense|income
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_id TEXT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- 4. TRANSACTIONS (Enforces composite FKs)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  type TEXT NOT NULL, -- expense|income|transfer
  category_id TEXT NULL,
  account_id TEXT NOT NULL,
  destination_account_id TEXT NULL,
  merchant TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:MM:SS
  notes TEXT NOT NULL DEFAULT '',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id TEXT NULL,
  receipt_uri TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_tx_account FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_dest_account FOREIGN KEY (user_id, destination_account_id) REFERENCES public.accounts(user_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, id) ON DELETE SET NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 5. TRANSACTION SPLITS
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_split_tx FOREIGN KEY (user_id, transaction_id) REFERENCES public.transactions(user_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_split_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, id) ON DELETE CASCADE
);

ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "splits_select" ON public.transaction_splits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "splits_insert" ON public.transaction_splits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "splits_update" ON public.transaction_splits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "splits_delete" ON public.transaction_splits FOR DELETE USING (auth.uid() = user_id);

-- 6. TAGS & TRANSACTION TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tags_update" ON public.tags FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transaction_tags (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (user_id, transaction_id, tag_id),
  CONSTRAINT fk_txtag_tx FOREIGN KEY (user_id, transaction_id) REFERENCES public.transactions(user_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_txtag_tag FOREIGN KEY (user_id, tag_id) REFERENCES public.tags(user_id, id) ON DELETE CASCADE
);

ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txtags_all" ON public.transaction_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  amount_paise BIGINT NOT NULL,
  start_date TEXT NOT NULL,
  rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alert_threshold_percent INT NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_budget_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, id) ON DELETE CASCADE
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- 8. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount_paise BIGINT NOT NULL,
  current_amount_paise BIGINT NOT NULL DEFAULT 0,
  target_date TEXT NOT NULL,
  monthly_contribution_paise BIGINT NOT NULL DEFAULT 0,
  account_id TEXT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_goal_account FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) ON DELETE SET NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- 9. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  billing_cycle TEXT NOT NULL, -- monthly|annual
  next_billing_date TEXT NOT NULL,
  category_id TEXT NULL,
  account_id TEXT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_sub_account FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, id) ON DELETE SET NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_delete" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 10. RECURRING TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT NULL,
  account_id TEXT NOT NULL,
  destination_account_id TEXT NULL,
  frequency TEXT NOT NULL,
  next_due_date TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NULL,
  auto_post BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_rec_account FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_category FOREIGN KEY (user_id, category_id) REFERENCES public.categories(user_id, id) ON DELETE SET NULL
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_select" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_insert" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_update" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_delete" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- 11. DASHBOARD PREFERENCES
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  order_index INT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, section_id)
);

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pref_all" ON public.dashboard_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- ATOMIC OPTIMISTIC CONCURRENCY & OWNERSHIP-VALIDATING STORED RPC FUNCTIONS
-- ============================================================================

-- A. TRANSACTION RPC
CREATE OR REPLACE FUNCTION public.sync_upsert_transaction(
  p_id TEXT,
  p_amount_paise BIGINT,
  p_type TEXT,
  p_category_id TEXT,
  p_account_id TEXT,
  p_destination_account_id TEXT,
  p_merchant TEXT,
  p_date TEXT,
  p_time TEXT,
  p_notes TEXT,
  p_is_recurring BOOLEAN,
  p_recurring_id TEXT,
  p_receipt_uri TEXT,
  p_client_version INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_version INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  -- Verify Account Ownership
  IF p_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE user_id = v_user_id AND id = p_account_id
  ) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Unowned primary account');
  END IF;

  -- Verify Destination Account Ownership
  IF p_destination_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE user_id = v_user_id AND id = p_destination_account_id
  ) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Unowned destination account');
  END IF;

  -- Verify Category Ownership
  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories WHERE user_id = v_user_id AND id = p_category_id
  ) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Unowned category');
  END IF;

  -- Lock row and get current server version
  SELECT version INTO v_existing_version
  FROM public.transactions
  WHERE user_id = v_user_id AND id = p_id
  FOR UPDATE;

  IF v_existing_version IS NULL THEN
    INSERT INTO public.transactions (
      id, user_id, amount_paise, type, category_id, account_id,
      destination_account_id, merchant, date, time, notes,
      is_recurring, recurring_id, receipt_uri, version
    ) VALUES (
      p_id, v_user_id, p_amount_paise, p_type, p_category_id, p_account_id,
      p_destination_account_id, p_merchant, p_date, p_time, p_notes,
      p_is_recurring, p_recurring_id, p_receipt_uri, GREATEST(1, p_client_version)
    );
    RETURN jsonb_build_object('status', 'CREATED', 'version', GREATEST(1, p_client_version));
  ELSIF v_existing_version = p_client_version THEN
    UPDATE public.transactions SET
      amount_paise = p_amount_paise,
      type = p_type,
      category_id = p_category_id,
      account_id = p_account_id,
      destination_account_id = p_destination_account_id,
      merchant = p_merchant,
      date = p_date,
      time = p_time,
      notes = p_notes,
      is_recurring = p_is_recurring,
      recurring_id = p_recurring_id,
      receipt_uri = p_receipt_uri,
      version = v_existing_version + 1,
      updated_at = NOW()
    WHERE user_id = v_user_id AND id = p_id;
    RETURN jsonb_build_object('status', 'UPDATED', 'version', v_existing_version + 1);
  ELSE
    RETURN jsonb_build_object(
      'status', 'CONFLICT',
      'server_version', v_existing_version,
      'client_version', p_client_version
    );
  END IF;
END;
$$;

-- B. ACCOUNT RPC
CREATE OR REPLACE FUNCTION public.sync_upsert_account(
  p_id TEXT,
  p_name TEXT,
  p_type TEXT,
  p_opening_balance_paise BIGINT,
  p_current_balance_paise BIGINT,
  p_currency_code TEXT,
  p_icon TEXT,
  p_color TEXT,
  p_is_archived BOOLEAN,
  p_client_version INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_version INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  SELECT version INTO v_existing_version
  FROM public.accounts
  WHERE user_id = v_user_id AND id = p_id
  FOR UPDATE;

  IF v_existing_version IS NULL THEN
    INSERT INTO public.accounts (
      id, user_id, name, type, opening_balance_paise, current_balance_paise,
      currency_code, icon, color, is_archived, version
    ) VALUES (
      p_id, v_user_id, p_name, p_type, p_opening_balance_paise, p_current_balance_paise,
      p_currency_code, p_icon, p_color, p_is_archived, GREATEST(1, p_client_version)
    );
    RETURN jsonb_build_object('status', 'CREATED', 'version', GREATEST(1, p_client_version));
  ELSIF v_existing_version = p_client_version THEN
    UPDATE public.accounts SET
      name = p_name, type = p_type, opening_balance_paise = p_opening_balance_paise,
      current_balance_paise = p_current_balance_paise, currency_code = p_currency_code,
      icon = p_icon, color = p_color, is_archived = p_is_archived,
      version = v_existing_version + 1, updated_at = NOW()
    WHERE user_id = v_user_id AND id = p_id;
    RETURN jsonb_build_object('status', 'UPDATED', 'version', v_existing_version + 1);
  ELSE
    RETURN jsonb_build_object('status', 'CONFLICT', 'server_version', v_existing_version, 'client_version', p_client_version);
  END IF;
END;
$$;

-- C. BUDGET RPC
CREATE OR REPLACE FUNCTION public.sync_upsert_budget(
  p_id TEXT,
  p_category_id TEXT,
  p_period TEXT,
  p_amount_paise BIGINT,
  p_start_date TEXT,
  p_rollover_enabled BOOLEAN,
  p_alert_threshold_percent INT,
  p_client_version INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_version INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories WHERE user_id = v_user_id AND id = p_category_id
  ) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Unowned category');
  END IF;

  SELECT version INTO v_existing_version
  FROM public.budgets
  WHERE user_id = v_user_id AND id = p_id
  FOR UPDATE;

  IF v_existing_version IS NULL THEN
    INSERT INTO public.budgets (
      id, user_id, category_id, period, amount_paise, start_date, rollover_enabled, alert_threshold_percent, version
    ) VALUES (
      p_id, v_user_id, p_category_id, p_period, p_amount_paise, p_start_date, p_rollover_enabled, p_alert_threshold_percent, GREATEST(1, p_client_version)
    );
    RETURN jsonb_build_object('status', 'CREATED', 'version', GREATEST(1, p_client_version));
  ELSIF v_existing_version = p_client_version THEN
    UPDATE public.budgets SET
      category_id = p_category_id, period = p_period, amount_paise = p_amount_paise,
      start_date = p_start_date, rollover_enabled = p_rollover_enabled,
      alert_threshold_percent = p_alert_threshold_percent,
      version = v_existing_version + 1, updated_at = NOW()
    WHERE user_id = v_user_id AND id = p_id;
    RETURN jsonb_build_object('status', 'UPDATED', 'version', v_existing_version + 1);
  ELSE
    RETURN jsonb_build_object('status', 'CONFLICT', 'server_version', v_existing_version, 'client_version', p_client_version);
  END IF;
END;
$$;

-- D. GOAL RPC
CREATE OR REPLACE FUNCTION public.sync_upsert_goal(
  p_id TEXT,
  p_name TEXT,
  p_target_amount_paise BIGINT,
  p_current_amount_paise BIGINT,
  p_target_date TEXT,
  p_monthly_contribution_paise BIGINT,
  p_account_id TEXT,
  p_icon TEXT,
  p_color TEXT,
  p_client_version INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_version INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  IF p_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE user_id = v_user_id AND id = p_account_id
  ) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Unowned account');
  END IF;

  SELECT version INTO v_existing_version
  FROM public.goals
  WHERE user_id = v_user_id AND id = p_id
  FOR UPDATE;

  IF v_existing_version IS NULL THEN
    INSERT INTO public.goals (
      id, user_id, name, target_amount_paise, current_amount_paise, target_date,
      monthly_contribution_paise, account_id, icon, color, version
    ) VALUES (
      p_id, v_user_id, p_name, p_target_amount_paise, p_current_amount_paise, p_target_date,
      p_monthly_contribution_paise, p_account_id, p_icon, p_color, GREATEST(1, p_client_version)
    );
    RETURN jsonb_build_object('status', 'CREATED', 'version', GREATEST(1, p_client_version));
  ELSIF v_existing_version = p_client_version THEN
    UPDATE public.goals SET
      name = p_name, target_amount_paise = p_target_amount_paise, current_amount_paise = p_current_amount_paise,
      target_date = p_target_date, monthly_contribution_paise = p_monthly_contribution_paise, account_id = p_account_id,
      icon = p_icon, color = p_color, version = v_existing_version + 1, updated_at = NOW()
    WHERE user_id = v_user_id AND id = p_id;
    RETURN jsonb_build_object('status', 'UPDATED', 'version', v_existing_version + 1);
  ELSE
    RETURN jsonb_build_object('status', 'CONFLICT', 'server_version', v_existing_version, 'client_version', p_client_version);
  END IF;
END;
$$;
