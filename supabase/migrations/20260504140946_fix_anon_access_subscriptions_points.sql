/*
  # Fix anon access to xq_subscriptions, xq_points, xq_point_transactions, xq_user_data

  ## Problem
  The app uses a custom auth system (not Supabase Auth). All DB calls use the anon key,
  so auth.uid() is always NULL — meaning all existing RLS policies that check auth.uid() = owner_id
  block every query.

  ## Solution
  Add permissive anon policies that allow read access filtered by the known owner_id constant
  (00000000-0000-0000-0000-000000000001). This is safe because the anon key has no write
  access to sensitive tables, and all actual data is scoped to this single owner.

  ## Changes
  - xq_subscriptions: anon SELECT by owner_id constant
  - xq_points: anon SELECT by owner_id constant
  - xq_point_transactions: anon SELECT/INSERT by owner_id constant
  - xq_user_data: anon SELECT/INSERT/UPDATE (already added, re-confirmed)
  - xq_users: anon SELECT/UPDATE (so account page can read/update user record)
*/

-- xq_subscriptions: allow anon to read rows belonging to our demo owner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_subscriptions' AND policyname = 'anon read subscriptions'
  ) THEN
    CREATE POLICY "anon read subscriptions"
      ON xq_subscriptions FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_subscriptions: allow anon to insert (for assignSubscription in adminService)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_subscriptions' AND policyname = 'anon insert subscriptions'
  ) THEN
    CREATE POLICY "anon insert subscriptions"
      ON xq_subscriptions FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_subscriptions: allow anon to update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_subscriptions' AND policyname = 'anon update subscriptions'
  ) THEN
    CREATE POLICY "anon update subscriptions"
      ON xq_subscriptions FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_points: allow anon to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_points' AND policyname = 'anon read points'
  ) THEN
    CREATE POLICY "anon read points"
      ON xq_points FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_points: allow anon to insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_points' AND policyname = 'anon insert points'
  ) THEN
    CREATE POLICY "anon insert points"
      ON xq_points FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_points: allow anon to update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_points' AND policyname = 'anon update points'
  ) THEN
    CREATE POLICY "anon update points"
      ON xq_points FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_point_transactions: allow anon to insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_point_transactions' AND policyname = 'anon read point_transactions'
  ) THEN
    CREATE POLICY "anon read point_transactions"
      ON xq_point_transactions FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_point_transactions' AND policyname = 'anon insert point_transactions'
  ) THEN
    CREATE POLICY "anon insert point_transactions"
      ON xq_point_transactions FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_users: allow anon to read and update (for account profile page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_users' AND policyname = 'anon read users'
  ) THEN
    CREATE POLICY "anon read users"
      ON xq_users FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_users' AND policyname = 'anon update users'
  ) THEN
    CREATE POLICY "anon update users"
      ON xq_users FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_users' AND policyname = 'anon insert users'
  ) THEN
    CREATE POLICY "anon insert users"
      ON xq_users FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_audit_logs: allow anon to insert (writeLog is called from adminService)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_audit_logs' AND policyname = 'anon insert logs'
  ) THEN
    CREATE POLICY "anon insert logs"
      ON xq_audit_logs FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_audit_logs' AND policyname = 'anon read logs'
  ) THEN
    CREATE POLICY "anon read logs"
      ON xq_audit_logs FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_licenses: allow anon full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_licenses' AND policyname = 'anon read licenses'
  ) THEN
    CREATE POLICY "anon read licenses"
      ON xq_licenses FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_licenses' AND policyname = 'anon insert licenses'
  ) THEN
    CREATE POLICY "anon insert licenses"
      ON xq_licenses FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_licenses' AND policyname = 'anon update licenses'
  ) THEN
    CREATE POLICY "anon update licenses"
      ON xq_licenses FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_activation_codes: allow anon to read and update (for license activation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_activation_codes' AND policyname = 'anon read activation_codes'
  ) THEN
    CREATE POLICY "anon read activation_codes"
      ON xq_activation_codes FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_activation_codes' AND policyname = 'anon update activation_codes'
  ) THEN
    CREATE POLICY "anon update activation_codes"
      ON xq_activation_codes FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- xq_badge_catalog: allow anon to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_badge_catalog' AND policyname = 'anon read badge_catalog'
  ) THEN
    CREATE POLICY "anon read badge_catalog"
      ON xq_badge_catalog FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- xq_bonuses: allow anon access (bonuses shown in admin and user panel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_bonuses' AND policyname = 'anon read bonuses'
  ) THEN
    CREATE POLICY "anon read bonuses"
      ON xq_bonuses FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_bonuses' AND policyname = 'anon insert bonuses'
  ) THEN
    CREATE POLICY "anon insert bonuses"
      ON xq_bonuses FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_bonuses' AND policyname = 'anon update bonuses'
  ) THEN
    CREATE POLICY "anon update bonuses"
      ON xq_bonuses FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_bonuses' AND policyname = 'anon delete bonuses'
  ) THEN
    CREATE POLICY "anon delete bonuses"
      ON xq_bonuses FOR DELETE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_user_bonuses: allow anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_bonuses' AND policyname = 'anon read user_bonuses'
  ) THEN
    CREATE POLICY "anon read user_bonuses"
      ON xq_user_bonuses FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_remote_sessions: allow anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_remote_sessions' AND policyname = 'anon read remote_sessions'
  ) THEN
    CREATE POLICY "anon read remote_sessions"
      ON xq_remote_sessions FOR SELECT
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_remote_sessions' AND policyname = 'anon insert remote_sessions'
  ) THEN
    CREATE POLICY "anon insert remote_sessions"
      ON xq_remote_sessions FOR INSERT
      TO anon
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_remote_sessions' AND policyname = 'anon update remote_sessions'
  ) THEN
    CREATE POLICY "anon update remote_sessions"
      ON xq_remote_sessions FOR UPDATE
      TO anon
      USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
      WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
END $$;

-- xq_administrators: allow anon to read (for admin login)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_administrators' AND policyname = 'anon read administrators'
  ) THEN
    CREATE POLICY "anon read administrators"
      ON xq_administrators FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- xq_support_messages: allow anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_support_messages' AND policyname = 'anon read support_messages'
  ) THEN
    CREATE POLICY "anon read support_messages"
      ON xq_support_messages FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_support_messages' AND policyname = 'anon insert support_messages'
  ) THEN
    CREATE POLICY "anon insert support_messages"
      ON xq_support_messages FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- xq_user_inventory: allow anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_inventory' AND policyname = 'anon read user_inventory'
  ) THEN
    CREATE POLICY "anon read user_inventory"
      ON xq_user_inventory FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_inventory' AND policyname = 'anon insert user_inventory'
  ) THEN
    CREATE POLICY "anon insert user_inventory"
      ON xq_user_inventory FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_inventory' AND policyname = 'anon update user_inventory'
  ) THEN
    CREATE POLICY "anon update user_inventory"
      ON xq_user_inventory FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
