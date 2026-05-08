-- ──────────────────────────────────────────────────────────────────────────
-- Migration 0005: Remove sub-workspace layer + add invitations + notifications
-- Apply in Supabase SQL Editor BEFORE deploying code changes.
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Drop junction tables that reference workspaces
DROP TABLE IF EXISTS net_worth_tab_fgts_workspaces;
DROP TABLE IF EXISTS net_worth_tab_investment_workspaces;
DROP TABLE IF EXISTS goal_linked_workspaces;
DROP TABLE IF EXISTS net_worth_tabs;

-- 2. Drop workspace_id columns from data tables
ALTER TABLE bills DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE monthly_bill_records DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE investments DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE investment_transactions DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE income_entries DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE fgts_records DROP COLUMN IF EXISTS workspace_id;

-- 3. Update unique constraints to use household_id instead of workspace_id
ALTER TABLE monthly_bill_records DROP CONSTRAINT IF EXISTS monthly_bill_records_workspace_id_month_key_key;
ALTER TABLE monthly_bill_records ADD CONSTRAINT monthly_bill_records_household_month_key UNIQUE (household_id, month_key);

ALTER TABLE fgts_records DROP CONSTRAINT IF EXISTS fgts_records_workspace_id_month_key_key;
ALTER TABLE fgts_records ADD CONSTRAINT fgts_records_household_month_key UNIQUE (household_id, month_key);

-- 4. Drop the workspaces table (after all FKs removed)
DROP TABLE IF EXISTS workspaces;

-- 5. Create workspace_invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined')),
  token         text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
CREATE INDEX IF NOT EXISTS workspace_invitations_email_idx ON workspace_invitations(invited_email);
CREATE INDEX IF NOT EXISTS workspace_invitations_household_idx ON workspace_invitations(household_id);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('workspace_invite')),
  title        text NOT NULL,
  body         text NOT NULL,
  data         jsonb NOT NULL DEFAULT '{}',
  is_read      boolean NOT NULL DEFAULT false,
  household_id uuid REFERENCES households(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, is_read);

-- 7. Helper function: create notifications for pending invitations
CREATE OR REPLACE FUNCTION create_pending_invite_notifications(p_user_id uuid, p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE inv RECORD;
BEGIN
  FOR inv IN
    SELECT wi.id, wi.household_id, h.name AS ws_name, p.full_name AS inviter_name
    FROM workspace_invitations wi
    JOIN households h ON h.id = wi.household_id
    JOIN profiles p ON p.id = wi.invited_by
    WHERE wi.invited_email = p_email
      AND wi.status = 'pending'
      AND wi.expires_at > now()
  LOOP
    INSERT INTO notifications (user_id, type, title, body, data, household_id)
    VALUES (
      p_user_id,
      'workspace_invite',
      'Convite para workspace',
      inv.inviter_name || ' convidou você para "' || inv.ws_name || '"',
      jsonb_build_object('invitation_id', inv.id, 'household_id', inv.household_id),
      inv.household_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 8. Replace handle_new_user: auto-create household + default categories on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_household_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');

  INSERT INTO public.households (name, created_by)
  VALUES ('Meu Espaço', NEW.id)
  RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');

  INSERT INTO public.categories (household_id, name, color, type, is_default, sort_order) VALUES
    (new_household_id, 'Moradia',        '#6366f1', 'bill',       true,  0),
    (new_household_id, 'Transporte',     '#3b82f6', 'bill',       true,  1),
    (new_household_id, 'Alimentação',    '#10b981', 'bill',       true,  2),
    (new_household_id, 'Saúde',          '#ef4444', 'bill',       true,  3),
    (new_household_id, 'Educação',       '#f59e0b', 'bill',       true,  4),
    (new_household_id, 'Lazer',          '#ec4899', 'bill',       true,  5),
    (new_household_id, 'Serviços',       '#8b5cf6', 'bill',       true,  6),
    (new_household_id, 'Seguros',        '#06b6d4', 'bill',       true,  7),
    (new_household_id, 'Outros',         '#6b7280', 'both',       true,  8),
    (new_household_id, 'Renda Fixa',     '#059669', 'investment', true,  9),
    (new_household_id, 'Renda Variável', '#d97706', 'investment', true, 10),
    (new_household_id, 'Criptomoedas',   '#f97316', 'investment', true, 11);

  PERFORM create_pending_invite_notifications(NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

-- 9. RLS for workspace_invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invitations' AND policyname = 'invitations_select') THEN
    CREATE POLICY "invitations_select" ON workspace_invitations FOR SELECT
      USING (is_household_member(household_id) OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invitations' AND policyname = 'invitations_insert') THEN
    CREATE POLICY "invitations_insert" ON workspace_invitations FOR INSERT
      WITH CHECK (is_household_owner(household_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invitations' AND policyname = 'invitations_update') THEN
    CREATE POLICY "invitations_update" ON workspace_invitations FOR UPDATE
      USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR is_household_owner(household_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invitations' AND policyname = 'invitations_delete') THEN
    CREATE POLICY "invitations_delete" ON workspace_invitations FOR DELETE
      USING (is_household_owner(household_id));
  END IF;
END $$;

-- 10. RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select') THEN
    CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_update') THEN
    CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_delete') THEN
    CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;
