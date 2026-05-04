/*
  # Fix RLS for all xq_ tables to allow demo owner (anon key)

  Adds permissive anon policies for all tables that use owner_id pattern
  with the fixed DEMO_OWNER_ID = '00000000-0000-0000-0000-000000000001'
*/

-- xq_licenses
CREATE POLICY "demo owner select lic" ON xq_licenses FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert lic" ON xq_licenses FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner update lic" ON xq_licenses FOR UPDATE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete lic" ON xq_licenses FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_audit_logs
CREATE POLICY "demo owner select logs" ON xq_audit_logs FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert logs" ON xq_audit_logs FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete logs" ON xq_audit_logs FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_points
CREATE POLICY "demo owner select points" ON xq_points FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert points" ON xq_points FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner update points" ON xq_points FOR UPDATE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete points" ON xq_points FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_bonuses
CREATE POLICY "demo owner select bonuses" ON xq_bonuses FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert bonuses" ON xq_bonuses FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner update bonuses" ON xq_bonuses FOR UPDATE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete bonuses" ON xq_bonuses FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_remote_sessions
CREATE POLICY "demo owner select rsess" ON xq_remote_sessions FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert rsess" ON xq_remote_sessions FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner update rsess" ON xq_remote_sessions FOR UPDATE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete rsess" ON xq_remote_sessions FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_point_transactions
CREATE POLICY "demo owner select ptx" ON xq_point_transactions FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert ptx" ON xq_point_transactions FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- xq_subscriptions
CREATE POLICY "demo owner select subs" ON xq_subscriptions FOR SELECT TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner insert subs" ON xq_subscriptions FOR INSERT TO anon
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner update subs" ON xq_subscriptions FOR UPDATE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
CREATE POLICY "demo owner delete subs" ON xq_subscriptions FOR DELETE TO anon
  USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid);
