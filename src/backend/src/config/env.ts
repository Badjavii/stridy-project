// ─── ENV CONFIG ───────────────────────────────────────────────────────────────
export const env = {
  PORT:         parseInt(process.env.PORT         ?? '3000'),
  DATABASE_URL: process.env.DATABASE_URL          ?? '',
  JWT_SECRET:   process.env.JWT_SECRET            ?? 'stridy-secret-change-in-production',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
  OPENROUTER_MODEL:   process.env.OPENROUTER_MODEL   ?? 'google/gemma-3n-e4b-it:free',
  NODE_ENV:     process.env.NODE_ENV              ?? 'development',
};

// Validar variables críticas
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida');
  process.exit(1);
}

if (!env.OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY no está definida — IA no funcionará');
}
