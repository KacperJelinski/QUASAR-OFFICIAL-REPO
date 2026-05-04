/*
  # Seed admin accounts

  Inserts two new administrator accounts:
  - CEO: Kacper Jeliński (jelkacperapple@gmail.com)
  - Admin: Tomasz Jeliński (tomekjel@gmail.com)

  Uses ON CONFLICT DO NOTHING to avoid duplicates.
*/

INSERT INTO xq_administrators (email, full_name, role, password)
VALUES
  ('jelkacperapple@gmail.com', 'Kacper Jeliński', 'CEO', 'B0nif@cy!?!'),
  ('tomekjel@gmail.com', 'Tomasz Jeliński', 'Admin', 'B0nifacy!')
ON CONFLICT (email) DO NOTHING;
