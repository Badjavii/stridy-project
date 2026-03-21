// ─── SCHEDULE ROUTES ──────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

const schedule = new Hono();
schedule.use('*', authMiddleware);

schedule.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await query(
    `SELECT ss.*, s.name AS subject_name, s.color
     FROM schedule_slots ss
     JOIN subjects s ON s.id = ss.subject_id
     WHERE ss.user_id = $1
     ORDER BY ss.day_of_week, ss.start_time`,
    [userId]
  );
  return c.json(rows);
});

schedule.post('/', async (c) => {
  const userId = c.get('userId');
  const { subject_id, day_of_week, start_time, end_time } = await c.req.json();

  if (!subject_id)  return c.json({ error: 'Materia requerida' }, 400);
  if (!day_of_week) return c.json({ error: 'Día requerido' }, 400);
  if (!start_time)  return c.json({ error: 'Hora inicio requerida' }, 400);
  if (!end_time)    return c.json({ error: 'Hora fin requerida' }, 400);

  const [slot] = await query(
    `INSERT INTO schedule_slots (user_id, subject_id, day_of_week, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, subject_id, day_of_week, start_time, end_time]
  );
  return c.json(slot, 201);
});

schedule.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const { day_of_week, start_time, end_time } = await c.req.json();

  const slot = await queryOne(
    'SELECT id FROM schedule_slots WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  if (!slot) return c.json({ error: 'No encontrado' }, 404);

  const updated = await queryOne(
    `UPDATE schedule_slots SET
       day_of_week = COALESCE($1, day_of_week),
       start_time  = COALESCE($2, start_time),
       end_time    = COALESCE($3, end_time)
     WHERE id=$4 RETURNING *`,
    [day_of_week, start_time, end_time, id]
  );
  return c.json(updated);
});

schedule.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const slot = await queryOne(
    'SELECT id FROM schedule_slots WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  if (!slot) return c.json({ error: 'No encontrado' }, 404);

  await query('DELETE FROM schedule_slots WHERE id=$1', [id]);
  return c.json({ success: true });
});

export default schedule;
