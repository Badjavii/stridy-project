// ─── FRIENDS ROUTES ───────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { authMiddleware } from '../middleware/auth';

const friends = new Hono();
friends.use('*', authMiddleware);

// GET /friends
friends.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await query(
    `SELECT
       f.id, f.status, f.created_at,
       CASE WHEN f.requester_id = $1 THEN false ELSE true END AS received,
       CASE WHEN f.requester_id = $1 THEN u2.id ELSE u1.id END AS friend_id,
       CASE WHEN f.requester_id = $1 THEN u2.username ELSE u1.username END AS username
     FROM friendships f
     JOIN users u1 ON u1.id = f.requester_id
     JOIN users u2 ON u2.id = f.receiver_id
     WHERE f.requester_id = $1 OR f.receiver_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return c.json(rows);
});

// POST /friends/request
friends.post('/request', async (c) => {
  const userId = c.get('userId');
  const { username } = await c.req.json();
  if (!username) return c.json({ error: 'Username requerido' }, 400);

  const formatted = username.startsWith('@') ? username : `@${username}`;
  const target = await queryOne('SELECT id FROM users WHERE username=$1', [formatted]);
  if (!target) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (target.id === userId) return c.json({ error: 'No puedes agregarte a ti mismo' }, 400);

  const existing = await queryOne(
    `SELECT id FROM friendships
     WHERE (requester_id=$1 AND receiver_id=$2)
        OR (requester_id=$2 AND receiver_id=$1)`,
    [userId, target.id]
  );
  if (existing) return c.json({ error: 'Solicitud ya existe' }, 409);

  const [f] = await query(
    'INSERT INTO friendships (requester_id, receiver_id) VALUES ($1,$2) RETURNING *',
    [userId, target.id]
  );
  return c.json({ ...f, username: formatted, received: false }, 201);
});

// PATCH /friends/:id/accept
friends.patch('/:id/accept', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const f = await queryOne(
    'SELECT id FROM friendships WHERE id=$1 AND receiver_id=$2 AND status=$3',
    [id, userId, 'pending']
  );
  if (!f) return c.json({ error: 'Solicitud no encontrada' }, 404);

  const updated = await queryOne(
    "UPDATE friendships SET status='accepted' WHERE id=$1 RETURNING *",
    [id]
  );
  return c.json(updated);
});

// DELETE /friends/:id
friends.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const f = await queryOne(
    'SELECT id FROM friendships WHERE id=$1 AND (requester_id=$2 OR receiver_id=$2)',
    [id, userId]
  );
  if (!f) return c.json({ error: 'No encontrado' }, 404);

  await query('DELETE FROM friendships WHERE id=$1', [id]);
  return c.json({ success: true });
});

// GET /friends/:id/subjects — ver materias de un amigo
friends.get('/:id/subjects', async (c) => {
  const userId = c.get('userId');
  const friendId = c.req.param('id');

  const friendship = await queryOne(
    `SELECT id FROM friendships
     WHERE status='accepted'
       AND ((requester_id=$1 AND receiver_id=$2)
         OR (requester_id=$2 AND receiver_id=$1))`,
    [userId, friendId]
  );
  if (!friendship) return c.json({ error: 'No son amigos' }, 403);

  const rows = await query(
    `SELECT s.id, s.name, s.color, s.credits, s.passing_grade,
       i.name AS institution_name,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', g.id, 'score', g.score, 'weight', g.weight
         )) FILTER (WHERE g.id IS NOT NULL), '[]'
       ) AS grades
     FROM subjects s
     LEFT JOIN institutions i ON i.id = s.institution_id
     LEFT JOIN grades g ON g.subject_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id, i.name`,
    [friendId]
  );
  return c.json(rows);
});

// GET /friends/:id/events
friends.get('/:id/events', async (c) => {
  const userId   = c.get('userId');
  const friendId = c.req.param('id');

  const friendship = await queryOne(
    `SELECT id FROM friendships
     WHERE status='accepted'
       AND ((requester_id=$1 AND receiver_id=$2)
         OR (requester_id=$2 AND receiver_id=$1))`,
    [userId, friendId]
  );
  if (!friendship) return c.json({ error: 'No son amigos' }, 403);

  const rows = await query(
    `SELECT e.*, s.name AS subject_name
     FROM events e
     LEFT JOIN subjects s ON s.id = e.subject_id
     WHERE e.user_id=$1
     ORDER BY e.date ASC`,
    [friendId]
  );
  return c.json(rows);
});

// GET /friends/:id/schedule
friends.get('/:id/schedule', async (c) => {
  const userId   = c.get('userId');
  const friendId = c.req.param('id');

  const friendship = await queryOne(
    `SELECT id FROM friendships
     WHERE status='accepted'
       AND ((requester_id=$1 AND receiver_id=$2)
         OR (requester_id=$2 AND receiver_id=$1))`,
    [userId, friendId]
  );
  if (!friendship) return c.json({ error: 'No son amigos' }, 403);

  const rows = await query(
    `SELECT ss.*, s.name AS subject_name, s.color
     FROM schedule_slots ss
     JOIN subjects s ON s.id = ss.subject_id
     WHERE ss.user_id=$1
     ORDER BY ss.day_of_week, ss.start_time`,
    [friendId]
  );
  return c.json(rows);
});

export default friends;
