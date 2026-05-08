-- ──────────────────────────────────────────────────────────────────────────
-- Migration 0006: Full data reset — DELETE without WHERE
-- Preserves schema, clears all rows. Run AFTER migration 0005.
-- To also clear auth.users, run:
--   DELETE FROM auth.users;
-- in the Supabase SQL Editor (requires service_role).
-- ──────────────────────────────────────────────────────────────────────────

DELETE FROM notifications;
DELETE FROM workspace_invitations;
DELETE FROM goal_contributions;
DELETE FROM goal_linked_investments;
DELETE FROM goals;
DELETE FROM bill_entries;
DELETE FROM monthly_bill_records;
DELETE FROM bills;
DELETE FROM investment_transactions;
DELETE FROM investments;
DELETE FROM fgts_records;
DELETE FROM income_entries;
DELETE FROM attachments;
DELETE FROM categories;
DELETE FROM custom_fields;
DELETE FROM household_members;
DELETE FROM households;
DELETE FROM profiles;
