// ─── INSTITUTIONS ROUTES ──────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

const institutions = new Hono();
institutions.use('*', authMiddleware);

// GET /institutions
institutions.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await query(
    `SELECT i.*,
       COUNT(s.id)::int AS subject_count
     FROM institutions i
     LEFT JOIN subjects s ON s.institution_id = i.id
     WHERE i.user_id = $1
     GROUP BY i.id
     ORDER BY i.created_at ASC`,
    [userId]
  );
  return c.json(rows);
});

// POST /institutions
institutions.post('/', async (c) => {
  const userId = c.get('userId');
  const { name, program, color } = await c.req.json();
  if (!name?.trim()) return c.json({ error: 'Nombre requerido' }, 400);

  const [inst] = await query(
    'INSERT INTO institutions (user_id, name, program, color) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, name.trim(), program?.trim() ?? '', color ?? '#7c6ef5']
  );
  return c.json(inst, 201);
});

// PATCH /institutions/:id
institutions.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();
  const { name, program, color } = await c.req.json();

  const inst = await queryOne(
    'SELECT id FROM institutions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!inst) return c.json({ error: 'No encontrada' }, 404);

  const updated = await queryOne(
    `UPDATE institutions SET
       name    = COALESCE($1, name),
       program = COALESCE($2, program),
       color   = COALESCE($3, color)
     WHERE id = $4 RETURNING *`,
    [name, program, color, id]
  );
  return c.json(updated);
});

// DELETE /institutions/:id
institutions.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();

  const inst = await queryOne(
    'SELECT id FROM institutions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!inst) return c.json({ error: 'No encontrada' }, 404);

  await query('DELETE FROM institutions WHERE id = $1', [id]);
  return c.json({ success: true });
});

export default institutions;
