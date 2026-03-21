// ─── SUBJECTS ROUTES ──────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

const subjects = new Hono();
subjects.use('*', authMiddleware);

// GET /subjects?institution_id=
subjects.get('/', async (c) => {
  const userId        = c.get('userId');
  const institutionId = c.req.query('institution_id');

  const params: any[] = [userId];
  let whereClause = 'WHERE s.user_id = $1';

  if (institutionId) {
    params.push(institutionId);
    whereClause += ` AND s.institution_id = $${params.length}`;
  }

  const rows = await query(
    `SELECT s.*,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', g.id, 'name', g.name, 'score', g.score, 'weight', g.weight
         )) FILTER (WHERE g.id IS NOT NULL), '[]'
       ) AS grades,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pg.id, 'name', pg.name, 'weight', pg.weight
         )) FILTER (WHERE pg.id IS NOT NULL), '[]'
       ) AS pending_grades
     FROM subjects s
     LEFT JOIN grades g ON g.subject_id = s.id
     LEFT JOIN pending_grades pg ON pg.subject_id = s.id
     ${whereClause}
     GROUP BY s.id
     ORDER BY s.created_at ASC`,
    params
  );
  return c.json(rows);
});

// POST /subjects
subjects.post('/', async (c) => {
  const userId = c.get('userId');
  const { institution_id, name, color, credits, passing_grade } = await c.req.json();

  if (!name?.trim())       return c.json({ error: 'Nombre requerido' }, 400);
  if (!institution_id)     return c.json({ error: 'Institución requerida' }, 400);

  const [sub] = await query(
    `INSERT INTO subjects (user_id, institution_id, name, color, credits, passing_grade)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, institution_id, name.trim(), color ?? '#7c6ef5', credits ?? 3, passing_grade ?? 3.0]
  );
  return c.json({ ...sub, grades: [], pending_grades: [] }, 201);
});

// PATCH /subjects/:id
subjects.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();
  const { name, color, credits, passing_grade } = await c.req.json();

  const sub = await queryOne('SELECT id FROM subjects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!sub) return c.json({ error: 'No encontrada' }, 404);

  const updated = await queryOne(
    `UPDATE subjects SET
       name          = COALESCE($1, name),
       color         = COALESCE($2, color),
       credits       = COALESCE($3, credits),
       passing_grade = COALESCE($4, passing_grade)
     WHERE id = $5 RETURNING *`,
    [name, color, credits, passing_grade, id]
  );
  return c.json(updated);
});

// PATCH /subjects/:id/notes
subjects.patch('/:id/notes', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();
  const { notes } = await c.req.json();

  const sub = await queryOne('SELECT id FROM subjects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!sub) return c.json({ error: 'No encontrada' }, 404);

  await query('UPDATE subjects SET notes=$1 WHERE id=$2', [notes ?? '', id]);
  return c.json({ success: true });
});

// DELETE /subjects/:id
subjects.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();

  const sub = await queryOne('SELECT id FROM subjects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!sub) return c.json({ error: 'No encontrada' }, 404);

  await query('DELETE FROM subjects WHERE id=$1', [id]);
  return c.json({ success: true });
});

// POST /subjects/:id/grades
subjects.post('/:id/grades', async (c) => {
  const userId = c.get('userId');
  const { id }  = c.req.param();
  const { name, score, weight } = await c.req.json();

  const sub = await queryOne('SELECT id FROM subjects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!sub) return c.json({ error: 'Materia no encontrada' }, 404);

  const [grade] = await query(
    'INSERT INTO grades (subject_id, name, score, weight) VALUES ($1,$2,$3,$4) RETURNING *',
    [id, name, score, weight]
  );
  return c.json(grade, 201);
});

export default subjects;
