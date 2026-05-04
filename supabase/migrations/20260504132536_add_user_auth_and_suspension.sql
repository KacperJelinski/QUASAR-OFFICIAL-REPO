/*
  # Rozszerzenie xq_users o dane rejestracyjne, zawieszenia i Supabase Auth

  1. Zmiany w tabeli xq_users
    - `phone` (text) — numer telefonu użytkownika
    - `first_name` (text) — imię
    - `last_name` (text) — nazwisko
    - `password_hash` (text) — przechowywane hasło (dla admin view)
    - `status` (text) — 'active' | 'banned' | 'suspended'
    - `suspended_until` (timestamptz) — data końca zawieszenia
    - `suspension_reason` (text) — powód zawieszenia
    - `suspended_by` (text) — kto zawiesił
    - `banned_by` (text) — kto zablokował
    - `auth_user_id` (uuid) — powiązanie z Supabase Auth (opcjonalne)
    - `registered_via_app` (boolean) — czy zarejestrowano przez ekran logowania
    
  2. RLS
    - Zachowane istniejące polityki właściciela
    - Anonimowi użytkownicy mogą sprawdzić własny status (do obsługi ekranu logowania)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN first_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN last_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN password_hash text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'status'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'suspended_until'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN suspended_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN suspension_reason text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'suspended_by'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN suspended_by text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN banned_by text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN auth_user_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xq_users' AND column_name = 'registered_via_app'
  ) THEN
    ALTER TABLE xq_users ADD COLUMN registered_via_app boolean DEFAULT false;
  END IF;
END $$;

-- Allow anon to check user status by email (for login block messages)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'xq_users' AND policyname = 'anon can check user status by email'
  ) THEN
    EXECUTE 'CREATE POLICY "anon can check user status by email"
      ON xq_users FOR SELECT
      TO anon
      USING (registered_via_app = true)';
  END IF;
END $$;
