// ─── GRADES ROUTES ────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

export const grades = new Hono();
grades.use('*', authMiddleware);

grades.patch('/:id', async (c) => {
  const userId   = c.get('userId');
  const { id }   = c.req.param();
  const { name, score, weight } = await c.req.json();

  const grade = await queryOne(
    `SELECT g.id FROM grades g
     JOIN subjects s ON s.id = g.subject_id
     WHERE g.id=$1 AND s.user_id=$2`,
    [id, userId]
  );
  if (!grade) return c.json({ error: 'No encontrada' }, 404);

  const updated = await queryOne(
    `UPDATE grades SET
       name   = COALESCE($1, name),
       score  = COALESCE($2, score),
       weight = COALESCE($3, weight)
     WHERE id=$4 RETURNING *`,
    [name, score, weight, id]
  );
  return c.json(updated);
});

grades.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const grade = await queryOne(
    `SELECT g.id FROM grades g
     JOIN subjects s ON s.id = g.subject_id
     WHERE g.id=$1 AND s.user_id=$2`,
    [id, userId]
  );
  if (!grade) return c.json({ error: 'No encontrada' }, 404);

  await query('DELETE FROM grades WHERE id=$1', [id]);
  return c.json({ success: true });
});
