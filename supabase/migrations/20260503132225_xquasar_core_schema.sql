/*
  # xQuasar Core Schema

  1. New Tables
    - `xq_users` — lista użytkowników (admin-managed, email, status banu)
    - `xq_subscriptions` — subskrypcje przypisane do użytkowników
    - `xq_licenses` — klucze licencyjne (plan, ważność, status)
    - `xq_audit_logs` — dziennik zdarzeń admina
    - `xq_chat_messages` — wiadomości czatu wsparcia
  2. Security
    - RLS włączony na wszystkich tabelach
    - Polityki tylko dla zalogowanych użytkowników, ograniczone do własnych rekordów lub odczytu własnych komunikatów
  3. Uwagi
    1. Żaden rekord nie jest otwarty dla anonima
    2. Domyślne wartości dla timestamp, status, plan
*/

CREATE TABLE IF NOT EXISTS xq_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  email text NOT NULL,
  full_name text DEFAULT '',
  banned boolean DEFAULT false,
  agent_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xq_users_owner_idx ON xq_users(owner_id);

ALTER TABLE xq_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select users" ON xq_users FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert users" ON xq_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update users" ON xq_users FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete users" ON xq_users FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE CASCADE,
  plan text DEFAULT 'Free',
  status text DEFAULT 'active',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select subs" ON xq_subscriptions FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert subs" ON xq_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update subs" ON xq_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete subs" ON xq_subscriptions FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE SET NULL,
  key text NOT NULL,
  plan text DEFAULT 'Free',
  status text DEFAULT 'active',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select lic" ON xq_licenses FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert lic" ON xq_licenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update lic" ON xq_licenses FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete lic" ON xq_licenses FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  level text DEFAULT 'INFO',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select logs" ON xq_audit_logs FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert logs" ON xq_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete logs" ON xq_audit_logs FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  role text DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select chat" ON xq_chat_messages FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert chat" ON xq_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete chat" ON xq_chat_messages FOR DELETE TO authenticated USING (auth.uid() = owner_id);
