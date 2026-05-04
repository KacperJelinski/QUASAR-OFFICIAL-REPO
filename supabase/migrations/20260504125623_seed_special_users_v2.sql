/*
  # Seed special user accounts (Kacper and Tomasz)

  Uses DO block to check existence before inserting.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM xq_users WHERE email = 'jelkacperapple@gmail.com') THEN
    INSERT INTO xq_users (owner_id, email, full_name, agent_id, role, license_override)
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'jelkacperapple@gmail.com', 'Kacper Jeliński', 'XQ-CEO-0001', 'CEO', 'unlimited');
  ELSE
    UPDATE xq_users SET role = 'CEO', license_override = 'unlimited', agent_id = 'XQ-CEO-0001'
    WHERE email = 'jelkacperapple@gmail.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM xq_users WHERE email = 'tomekjel@gmail.com') THEN
    INSERT INTO xq_users (owner_id, email, full_name, agent_id, role, license_override)
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'tomekjel@gmail.com', 'Tomasz Jeliński', 'XQ-ADM-0001', 'Admin', 'unlimited');
  ELSE
    UPDATE xq_users SET role = 'Admin', license_override = 'unlimited', agent_id = 'XQ-ADM-0001'
    WHERE email = 'tomekjel@gmail.com';
  END IF;
END $$;
