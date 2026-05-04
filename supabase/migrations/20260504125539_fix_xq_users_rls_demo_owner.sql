/*
  # Fix xq_users RLS policies for demo owner

  The app uses a fixed DEMO_OWNER_ID ('00000000-0000-0000-0000-000000000001') with the anon key.
  Current policies require auth.uid() = owner_id, which blocks anon access.
  Adding additional policies to allow operations when owner_id matches the demo UUID.

  Also adds role column to xq_users for displaying CEO/Admin badges.
*/

-- Drop restrictive-only policies and add permissive ones for demo owner
CREATE POLICY "demo owner select users"
  ON xq_users FOR SELECT
  TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "demo owner insert users"
  ON xq_users FOR INSERT
  TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "demo owner update users"
  ON xq_users FOR UPDATE
  TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "demo owner delete users"
  ON xq_users FOR DELETE
  TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Add role column if not exists (for CEO/Admin badges on users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN role text DEFAULT '';
  END IF;
END $$;

-- Add license_override column (for unlimited license for special accounts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'license_override'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN license_override text DEFAULT '';
  END IF;
END $$;
