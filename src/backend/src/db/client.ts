// ─── DB CLIENT ────────────────────────────────────────────────────────────────
import pg from 'pg';
import { env } from '../config/env';

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

db.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

// Helper para queries
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await db.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
