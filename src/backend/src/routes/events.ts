// ─── EVENTS ROUTES ────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

const events = new Hono();
events.use('*', authMiddleware);

events.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await query(
    `SELECT e.*, s.name AS subject_name
     FROM events e
     LEFT JOIN subjects s ON s.id = e.subject_id
     WHERE e.user_id = $1
     ORDER BY e.date ASC`,
    [userId]
  );
  return c.json(rows);
});

events.post('/', async (c) => {
  const userId = c.get('userId');
  const { title, date, type, subject_id } = await c.req.json();
  if (!title?.trim()) return c.json({ error: 'Título requerido' }, 400);
  if (!date)          return c.json({ error: 'Fecha requerida' }, 400);

  const [ev] = await query(
    `INSERT INTO events (user_id, subject_id, title, date, type)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, subject_id ?? null, title.trim(), date, type ?? 'class']
  );
  return c.json(ev, 201);
});

events.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const { title, date, type, subject_id } = await c.req.json();

  const ev = await queryOne('SELECT id FROM events WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!ev) return c.json({ error: 'No encontrado' }, 404);

  const updated = await queryOne(
    `UPDATE events SET
       title      = COALESCE($1, title),
       date       = COALESCE($2, date),
       type       = COALESCE($3, type),
       subject_id = COALESCE($4, subject_id)
     WHERE id=$5 RETURNING *`,
    [title, date, type, subject_id, id]
  );
  return c.json(updated);
});

events.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const ev = await queryOne('SELECT id FROM events WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!ev) return c.json({ error: 'No encontrado' }, 404);

  await query('DELETE FROM events WHERE id=$1', [id]);
  return c.json({ success: true });
});

export default events;
