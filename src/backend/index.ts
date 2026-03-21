// ─── STRIDY BACKEND ───────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './src/config/env';
import { migrate } from './src/db/migrate';

// Routes
import auth         from './src/routes/auth';
import institutions from './src/routes/institutions';
import subjects     from './src/routes/subjects';
import { grades }   from './src/routes/grades';
import events       from './src/routes/events';
import schedule     from './src/routes/schedule';
import friends      from './src/routes/friends';
import ai           from './src/routes/ai';

const app = new Hono();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', cors({
  origin:  ['http://localhost:5173', 'http://157.254.174.68'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization'],
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ status: 'ok', app: 'Stridy API' }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.route('/api/auth',         auth);
app.route('/api/institutions', institutions);
app.route('/api/subjects',     subjects);
app.route('/api/grades',       grades);
app.route('/api/events',       events);
app.route('/api/schedule',     schedule);
app.route('/api/friends',      friends);
app.route('/api/ai',           ai);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404));

// ── Error handler ─────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Error interno del servidor' }, 500);
});

// ── Arrancar servidor ─────────────────────────────────────────────────────────
async function main() {
  await migrate();
  console.log(`Stridy API corriendo en http://localhost:${env.PORT}`);

  Bun.serve({
    port:  env.PORT,
    fetch: app.fetch,
  });
}

main().catch(console.error);
