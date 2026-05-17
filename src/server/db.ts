import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query(text, params);
}

export async function getOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] || null;
}

export async function getAll<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function initDb() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

export default pool;
