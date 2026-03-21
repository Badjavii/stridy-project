// ─── MIGRATE ──────────────────────────────────────────────────────────────────
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client';

export async function migrate() {
  try {
    const schema = readFileSync(join(import.meta.dir, 'schema.sql'), 'utf-8');
    await db.query(schema);
    console.log('Base de datos migrada correctamente');
  } catch (err) {
    console.error('Error al migrar la base de datos:', err);
    throw err;
  }
}
