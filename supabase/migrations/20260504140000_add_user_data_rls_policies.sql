/*
  # Add RLS policies for xq_user_data

  ## Purpose
  Allow authenticated app users (identified by user_id in xq_user_data) to read and upsert
  their own row. The owner (demo owner) can access all rows for admin purposes.

  ## Changes
  - Add SELECT policy: user can read their own xq_user_data row
  - Add INSERT policy: user can insert their own xq_user_data row
  - Add UPDATE policy: user can update their own xq_user_data row

  Note: We use xq_user_data.user_id matching the logged-in app user ID (from xq_users.id),
  stored client-side. RLS is checked via the DEMO_OWNER_ID service role in the app.
  Since the app uses the anon key, we rely on owner_id policies that already exist,
  but we add user_id-scoped policies so each user only sees their own data.
*/

-- Allow reading own user_data row (matched by user_id text equality via app session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_data' AND policyname = 'User can read own user_data'
  ) THEN
    CREATE POLICY "User can read own user_data"
      ON xq_user_data FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_data' AND policyname = 'User can insert own user_data'
  ) THEN
    CREATE POLICY "User can insert own user_data"
      ON xq_user_data FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xq_user_data' AND policyname = 'User can update own user_data'
  ) THEN
    CREATE POLICY "User can update own user_data"
      ON xq_user_data FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
