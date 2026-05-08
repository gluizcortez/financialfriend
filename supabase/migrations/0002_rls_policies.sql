-- Migration 0002: Row Level Security Policies
-- Default deny on all tables — members can only access their household's data

-- ============================================================
-- HELPER: check if current user is member of a household
-- ============================================================
CREATE OR REPLACE FUNCTION is_household_member(hid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_household_owner(hid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_select_member" ON households
  FOR SELECT USING (is_household_member(id));

CREATE POLICY "households_insert_own" ON households
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "households_update_owner" ON households
  FOR UPDATE USING (is_household_owner(id));

-- ============================================================
-- HOUSEHOLD MEMBERS
-- ============================================================
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_members_select" ON household_members
  FOR SELECT USING (is_household_member(household_id));

-- Only owners can add/remove members
CREATE POLICY "household_members_insert_owner" ON household_members
  FOR INSERT WITH CHECK (is_household_owner(household_id) OR user_id = auth.uid());

CREATE POLICY "household_members_delete_owner" ON household_members
  FOR DELETE USING (is_household_owner(household_id) OR user_id = auth.uid());

-- ============================================================
-- MACRO: standard household policies for a table
-- All remaining tables use household_id for isolation
-- ============================================================

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (is_household_member(household_id));

-- CUSTOM FIELDS
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_select" ON custom_fields
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "custom_fields_insert" ON custom_fields
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "custom_fields_update" ON custom_fields
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "custom_fields_delete" ON custom_fields
  FOR DELETE USING (is_household_member(household_id));

-- WORKSPACES
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select" ON workspaces
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "workspaces_update" ON workspaces
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "workspaces_delete" ON workspaces
  FOR DELETE USING (is_household_member(household_id));

-- BILLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bills_select" ON bills
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "bills_insert" ON bills
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "bills_update" ON bills
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "bills_delete" ON bills
  FOR DELETE USING (is_household_member(household_id));

-- MONTHLY BILL RECORDS
ALTER TABLE monthly_bill_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_bill_records_select" ON monthly_bill_records
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "monthly_bill_records_insert" ON monthly_bill_records
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "monthly_bill_records_update" ON monthly_bill_records
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "monthly_bill_records_delete" ON monthly_bill_records
  FOR DELETE USING (is_household_member(household_id));

-- BILL ENTRIES
ALTER TABLE bill_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bill_entries_select" ON bill_entries
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "bill_entries_insert" ON bill_entries
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "bill_entries_update" ON bill_entries
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "bill_entries_delete" ON bill_entries
  FOR DELETE USING (is_household_member(household_id));

-- ATTACHMENTS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_select" ON attachments
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "attachments_insert" ON attachments
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "attachments_delete" ON attachments
  FOR DELETE USING (is_household_member(household_id));

-- INVESTMENTS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments_select" ON investments
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "investments_insert" ON investments
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "investments_update" ON investments
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "investments_delete" ON investments
  FOR DELETE USING (is_household_member(household_id));

-- INVESTMENT TRANSACTIONS
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investment_transactions_select" ON investment_transactions
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "investment_transactions_insert" ON investment_transactions
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "investment_transactions_update" ON investment_transactions
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "investment_transactions_delete" ON investment_transactions
  FOR DELETE USING (is_household_member(household_id));

-- FGTS RECORDS
ALTER TABLE fgts_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fgts_records_select" ON fgts_records
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "fgts_records_insert" ON fgts_records
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "fgts_records_update" ON fgts_records
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "fgts_records_delete" ON fgts_records
  FOR DELETE USING (is_household_member(household_id));

-- GOALS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (is_household_member(household_id));

-- GOAL LINKED WORKSPACES (RLS via join to goals)
ALTER TABLE goal_linked_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_linked_workspaces_select" ON goal_linked_workspaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );
CREATE POLICY "goal_linked_workspaces_insert" ON goal_linked_workspaces
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );
CREATE POLICY "goal_linked_workspaces_delete" ON goal_linked_workspaces
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );

-- GOAL LINKED INVESTMENTS
ALTER TABLE goal_linked_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_linked_investments_select" ON goal_linked_investments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );
CREATE POLICY "goal_linked_investments_insert" ON goal_linked_investments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );
CREATE POLICY "goal_linked_investments_delete" ON goal_linked_investments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_id AND is_household_member(g.household_id))
  );

-- GOAL CONTRIBUTIONS
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_contributions_select" ON goal_contributions
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "goal_contributions_insert" ON goal_contributions
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "goal_contributions_update" ON goal_contributions
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "goal_contributions_delete" ON goal_contributions
  FOR DELETE USING (is_household_member(household_id));

-- INCOME ENTRIES
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_entries_select" ON income_entries
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "income_entries_insert" ON income_entries
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "income_entries_update" ON income_entries
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "income_entries_delete" ON income_entries
  FOR DELETE USING (is_household_member(household_id));

-- NET WORTH TABS
ALTER TABLE net_worth_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "net_worth_tabs_select" ON net_worth_tabs
  FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "net_worth_tabs_insert" ON net_worth_tabs
  FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "net_worth_tabs_update" ON net_worth_tabs
  FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "net_worth_tabs_delete" ON net_worth_tabs
  FOR DELETE USING (is_household_member(household_id));

-- NET WORTH TAB INVESTMENT WORKSPACES
ALTER TABLE net_worth_tab_investment_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nw_inv_ws_select" ON net_worth_tab_investment_workspaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );
CREATE POLICY "nw_inv_ws_insert" ON net_worth_tab_investment_workspaces
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );
CREATE POLICY "nw_inv_ws_delete" ON net_worth_tab_investment_workspaces
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );

-- NET WORTH TAB FGTS WORKSPACES
ALTER TABLE net_worth_tab_fgts_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nw_fgts_ws_select" ON net_worth_tab_fgts_workspaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );
CREATE POLICY "nw_fgts_ws_insert" ON net_worth_tab_fgts_workspaces
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );
CREATE POLICY "nw_fgts_ws_delete" ON net_worth_tab_fgts_workspaces
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM net_worth_tabs t WHERE t.id = tab_id AND is_household_member(t.household_id))
  );

-- ============================================================
-- RELEASE NOTES — public read, no write from client
-- ============================================================
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "release_notes_select_all" ON release_notes
  FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE only via service_role (no client policy needed)
