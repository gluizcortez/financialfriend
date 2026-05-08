-- Migration 0001: Initial Schema for Kortex - Gestão Financeira
-- All monetary values stored as bigint in centavos (cents)

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HOUSEHOLDS (shared financial context)
-- ============================================================
CREATE TABLE IF NOT EXISTS households (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HOUSEHOLD MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS household_members (
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS household_members_user_id_idx ON household_members(user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  color         text NOT NULL,
  icon          text,
  type          text NOT NULL CHECK (type IN ('bill', 'investment', 'both')),
  is_default    boolean NOT NULL DEFAULT false,
  sort_order    int NOT NULL DEFAULT 0,
  budget_cents  bigint CHECK (budget_cents >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_household_id_idx ON categories(household_id);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CUSTOM FIELDS
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('text', 'number', 'date', 'select')),
  options       jsonb,
  applies_to    text NOT NULL CHECK (applies_to IN ('bills', 'investments', 'both')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_fields_household_id_idx ON custom_fields(household_id);

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('bills', 'investments', 'fgts', 'income')),
  color         text NOT NULL,
  icon          text,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_household_id_idx ON workspaces(household_id);

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- BILLS (recurring bill templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  value_cents   bigint NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  due_day       int NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  category_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  notes         text NOT NULL DEFAULT '',
  is_recurring  boolean NOT NULL DEFAULT true,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_workspace_id_idx ON bills(workspace_id);

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MONTHLY BILL RECORDS (container per workspace+month)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_bill_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  month_key     text NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, month_key)
);

CREATE INDEX IF NOT EXISTS monthly_bill_records_workspace_month_idx ON monthly_bill_records(workspace_id, month_key);

-- ============================================================
-- BILL ENTRIES (actual bill instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_record_id uuid NOT NULL REFERENCES monthly_bill_records(id) ON DELETE CASCADE,
  bill_id           uuid REFERENCES bills(id) ON DELETE SET NULL,
  household_id      uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name              text NOT NULL,
  value_cents       bigint NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  due_date          date NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_date         timestamptz,
  notes             text NOT NULL DEFAULT '',
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  custom_fields     jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bill_entries_monthly_record_id_idx ON bill_entries(monthly_record_id);
CREATE INDEX IF NOT EXISTS bill_entries_household_id_idx ON bill_entries(household_id);
CREATE INDEX IF NOT EXISTS bill_entries_due_date_idx ON bill_entries(due_date);

CREATE TRIGGER bill_entries_updated_at
  BEFORE UPDATE ON bill_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ATTACHMENTS (references to Supabase Storage objects)
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  entity_type   text NOT NULL CHECK (entity_type IN ('bill_entry', 'investment_transaction')),
  entity_id     uuid NOT NULL,
  storage_path  text NOT NULL,
  name          text NOT NULL,
  size_bytes    bigint NOT NULL CHECK (size_bytes > 0),
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attachments_entity_id_type_idx ON attachments(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS attachments_household_id_idx ON attachments(household_id);

-- ============================================================
-- INVESTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id          uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  type                  text NOT NULL CHECK (type IN ('renda_fixa', 'acoes', 'fundo', 'cripto', 'outro')),
  current_balance_cents bigint NOT NULL DEFAULT 0,
  notes                 text NOT NULL DEFAULT '',
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investments_workspace_id_idx ON investments(workspace_id);

CREATE TRIGGER investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INVESTMENT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('contribution', 'withdrawal', 'yield')),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  month_key     text NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  date          date NOT NULL,
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investment_transactions_investment_id_idx ON investment_transactions(investment_id);
CREATE INDEX IF NOT EXISTS investment_transactions_month_key_idx ON investment_transactions(month_key);
CREATE INDEX IF NOT EXISTS investment_transactions_household_id_idx ON investment_transactions(household_id);

CREATE TRIGGER investment_transactions_updated_at
  BEFORE UPDATE ON investment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FGTS RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS fgts_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  month_key     text NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  balance_cents bigint NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  notes         text NOT NULL DEFAULT '',
  date          date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, month_key)
);

CREATE INDEX IF NOT EXISTS fgts_records_workspace_month_idx ON fgts_records(workspace_id, month_key);

CREATE TRIGGER fgts_records_updated_at
  BEFORE UPDATE ON fgts_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                text NOT NULL,
  description         text NOT NULL DEFAULT '',
  goal_type           text NOT NULL CHECK (goal_type IN ('manual', 'investment_linked')),
  target_amount_cents bigint NOT NULL DEFAULT 0 CHECK (target_amount_cents >= 0),
  periodicity         text NOT NULL CHECK (periodicity IN ('monthly', 'quarterly', 'semiannual', 'yearly', 'custom')),
  custom_period_days  int CHECK (custom_period_days > 0),
  start_date          date NOT NULL,
  end_date            date,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_household_id_idx ON goals(household_id);

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- GOAL LINKED WORKSPACES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_linked_workspaces (
  goal_id       uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, workspace_id)
);

-- ============================================================
-- GOAL LINKED INVESTMENTS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_linked_investments (
  goal_id       uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  investment_id uuid NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, investment_id)
);

-- ============================================================
-- GOAL CONTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_contributions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id              uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  household_id         uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  period_key           text NOT NULL,
  target_amount_cents  bigint NOT NULL DEFAULT 0 CHECK (target_amount_cents >= 0),
  actual_amount_cents  bigint NOT NULL DEFAULT 0 CHECK (actual_amount_cents >= 0),
  date                 date NOT NULL,
  notes                text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON goal_contributions(goal_id);

CREATE TRIGGER goal_contributions_updated_at
  BEFORE UPDATE ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INCOME ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS income_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  month_key     text NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  name          text NOT NULL,
  amount_cents  bigint NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  category      text NOT NULL CHECK (category IN ('salary', 'freelance', 'investments', 'bonus', 'other')),
  date          date NOT NULL,
  notes         text NOT NULL DEFAULT '',
  is_recurring  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS income_entries_workspace_month_idx ON income_entries(workspace_id, month_key);
CREATE INDEX IF NOT EXISTS income_entries_household_id_idx ON income_entries(household_id);

CREATE TRIGGER income_entries_updated_at
  BEFORE UPDATE ON income_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NET WORTH TABS
-- ============================================================
CREATE TABLE IF NOT EXISTS net_worth_tabs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS net_worth_tabs_household_id_idx ON net_worth_tabs(household_id);

CREATE TRIGGER net_worth_tabs_updated_at
  BEFORE UPDATE ON net_worth_tabs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NET WORTH TAB INVESTMENT WORKSPACES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS net_worth_tab_investment_workspaces (
  tab_id        uuid NOT NULL REFERENCES net_worth_tabs(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (tab_id, workspace_id)
);

-- ============================================================
-- NET WORTH TAB FGTS WORKSPACES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS net_worth_tab_fgts_workspaces (
  tab_id        uuid NOT NULL REFERENCES net_worth_tabs(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (tab_id, workspace_id)
);

-- ============================================================
-- RELEASE NOTES (version changelog)
-- ============================================================
CREATE TABLE IF NOT EXISTS release_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version      text NOT NULL UNIQUE,
  title        text NOT NULL,
  content      text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_latest    boolean NOT NULL DEFAULT false
);

-- Ensure only one row is marked as latest
CREATE OR REPLACE FUNCTION enforce_single_latest_release_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_latest THEN
    UPDATE release_notes SET is_latest = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_notes_single_latest
  BEFORE INSERT OR UPDATE ON release_notes
  FOR EACH ROW EXECUTE FUNCTION enforce_single_latest_release_note();
