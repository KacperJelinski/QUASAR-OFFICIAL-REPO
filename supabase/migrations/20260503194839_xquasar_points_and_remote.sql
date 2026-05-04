/*
  # xQuasar Points, Bonuses, Remote Access & Notifications

  1. New Tables
    - `xq_points` — saldo punktów per użytkownik
    - `xq_point_transactions` — historia transakcji punktów
    - `xq_bonuses` — katalog bonusów dostępnych w sklepie
    - `xq_user_bonuses` — bonusy wykupione/przypisane użytkownikom
    - `xq_remote_sessions` — stan zdalnego dostępu do urządzeń
    - `xq_notifications` — powiadomienia w panelu
  2. Security
    - RLS włączony na wszystkich nowych tabelach
    - Polityki ograniczone do właściciela (owner_id = auth.uid())
*/

CREATE TABLE IF NOT EXISTS xq_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE CASCADE,
  balance integer DEFAULT 0,
  lifetime integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xq_points_owner_idx ON xq_points(owner_id);

ALTER TABLE xq_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select points" ON xq_points FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert points" ON xq_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update points" ON xq_points FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete points" ON xq_points FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  kind text DEFAULT 'adjust',
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select ptx" ON xq_point_transactions FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert ptx" ON xq_point_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete ptx" ON xq_point_transactions FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  cost integer DEFAULT 0,
  icon text DEFAULT 'Gift',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select bonuses" ON xq_bonuses FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert bonuses" ON xq_bonuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update bonuses" ON xq_bonuses FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete bonuses" ON xq_bonuses FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_user_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE CASCADE,
  bonus_id uuid REFERENCES xq_bonuses(id) ON DELETE CASCADE,
  redeemed_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);

ALTER TABLE xq_user_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select ubonuses" ON xq_user_bonuses FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert ubonuses" ON xq_user_bonuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update ubonuses" ON xq_user_bonuses FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete ubonuses" ON xq_user_bonuses FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_remote_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES xq_users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  status text DEFAULT 'idle',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_remote_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select rsess" ON xq_remote_sessions FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert rsess" ON xq_remote_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update rsess" ON xq_remote_sessions FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete rsess" ON xq_remote_sessions FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS xq_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  severity text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xq_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select notif" ON xq_notifications FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner insert notif" ON xq_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update notif" ON xq_notifications FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner delete notif" ON xq_notifications FOR DELETE TO authenticated USING (auth.uid() = owner_id);