-- Migration 0008: Fix category deletion RLS + standardise default bill categories
-- Apply in Supabase SQL Editor.

-- 1. Fix RLS: default categories (is_default = true) cannot be deleted by anyone
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (is_household_member(household_id) AND NOT is_default);

-- 2. Un-protect investment/both categories + Moradia (they are not the standard defaults)
UPDATE categories
SET is_default = false
WHERE type IN ('investment', 'both')
   OR (name = 'Moradia' AND type = 'bill');

-- 3. Mark existing bill categories that match the 8 standard names as protected
UPDATE categories
SET is_default = true
WHERE type = 'bill'
  AND name IN ('Transporte', 'Alimentação', 'Saúde', 'Educação',
               'Lazer', 'Serviços', 'Seguros', 'Outros');

-- 4. Insert any missing default categories for ALL existing households
INSERT INTO categories (household_id, name, color, type, is_default, sort_order)
SELECT h.id, cats.name, cats.color, 'bill', true, cats.ord
FROM households h
CROSS JOIN (VALUES
  ('Transporte',  '#3b82f6', 0),
  ('Alimentação', '#10b981', 1),
  ('Saúde',       '#ef4444', 2),
  ('Educação',    '#f59e0b', 3),
  ('Lazer',       '#ec4899', 4),
  ('Serviços',    '#8b5cf6', 5),
  ('Seguros',     '#06b6d4', 6),
  ('Outros',      '#6b7280', 7)
) AS cats(name, color, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.household_id = h.id AND c.name = cats.name
);

-- 5. Update handle_new_user to use the 8 standard bill-only defaults (no Moradia, no investment types)
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_household_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.households (name, created_by)
  VALUES ('Meu Espaço', NEW.id)
  RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');

  INSERT INTO public.categories (household_id, name, color, type, is_default, sort_order) VALUES
    (new_household_id, 'Transporte',  '#3b82f6', 'bill', true, 0),
    (new_household_id, 'Alimentação', '#10b981', 'bill', true, 1),
    (new_household_id, 'Saúde',       '#ef4444', 'bill', true, 2),
    (new_household_id, 'Educação',    '#f59e0b', 'bill', true, 3),
    (new_household_id, 'Lazer',       '#ec4899', 'bill', true, 4),
    (new_household_id, 'Serviços',    '#8b5cf6', 'bill', true, 5),
    (new_household_id, 'Seguros',     '#06b6d4', 'bill', true, 6),
    (new_household_id, 'Outros',      '#6b7280', 'bill', true, 7);

  BEGIN
    PERFORM create_pending_invite_notifications(NEW.id, NEW.email);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
