// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt';

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.req.header('Authorization');

  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'No autorizado' }, 401);
  }

  const token   = auth.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Token inválido o expirado' }, 401);
  }

  c.set('userId',   payload.userId);
  c.set('username', payload.username);
  await next();
}
