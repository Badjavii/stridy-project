// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { query, queryOne } from '../db/client';
import { signToken } from '../lib/jwt';
import { authMiddleware } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const auth = new Hono();

// Generar clave de 16 caracteres
function generateAccessKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 16 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// Generar username aleatorio único
function generateUsername(): string {
  const adjectives = ['cosmic', 'swift', 'bright', 'clever', 'brave', 'calm', 'eager', 'fierce'];
  const nouns      = ['student', 'scholar', 'learner', 'thinker', 'reader', 'coder', 'writer'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(Math.random() * 9999);
  return `@${adj}${noun}${num}`;
}

// POST /auth/register
auth.post('/register', async (c) => {
  try {
    let accessKey: string;
    let attempts = 0;

    // Generar clave única
    do {
      accessKey = generateAccessKey();
      const existing = await queryOne('SELECT id FROM users WHERE access_key = $1', [accessKey]);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Generar username único
    let username: string;
    do {
      username = generateUsername();
      const existing = await queryOne('SELECT id FROM users WHERE username = $1', [username]);
      if (!existing) break;
    } while (true);

    const [user] = await query(
      'INSERT INTO users (access_key, username) VALUES ($1, $2) RETURNING id, username',
      [accessKey, username]
    );

    const token = await signToken({ userId: user.id, username: user.username });

    return c.json({ access_key: accessKey, username: user.username, token }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Error al registrar usuario' }, 500);
  }
});

// POST /auth/login
auth.post('/login', async (c) => {
  try {
    const { access_key } = await c.req.json();
    if (!access_key) return c.json({ error: 'Clave requerida' }, 400);

    const user = await queryOne(
      'UPDATE users SET last_login = NOW() WHERE access_key = $1 RETURNING id, username',
      [access_key]
    );

    if (!user) return c.json({ error: 'Clave incorrecta' }, 401);

    const token = await signToken({ userId: user.id, username: user.username });
    return c.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// GET /auth/me
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user   = await queryOne('SELECT id, username, created_at FROM users WHERE id = $1', [userId]);
  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404);
  return c.json(user);
});

// PATCH /auth/username
auth.patch('/username', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { username } = await c.req.json();

  if (!username?.trim()) return c.json({ error: 'Username requerido' }, 400);

  const formatted = username.startsWith('@') ? username : `@${username}`;

  const existing = await queryOne('SELECT id FROM users WHERE username = $1 AND id != $2', [formatted, userId]);
  if (existing) return c.json({ error: 'Username ya en uso' }, 409);

  const user = await queryOne(
    'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username',
    [formatted, userId]
  );

  return c.json(user);
});

export default auth;
