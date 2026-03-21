// ─── AUTH API ─────────────────────────────────────────────────────────────────
import { api, setToken } from './client';

// Registrar nuevo usuario → recibe la access_key generada y el JWT
export async function register() {
  const data = await api.post('/auth/register');
  if (data.token) setToken(data.token);
  return data; // { access_key, username, token }
}

// Iniciar sesión con clave de 16 chars
export async function login(accessKey) {
  const data = await api.post('/auth/login', { access_key: accessKey });
  if (data.token) setToken(data.token);
  return data; // { token, user }
}

// Obtener perfil del usuario autenticado
export async function getMe() {
  return api.get('/auth/me'); // { id, username, created_at }
}

// Cambiar username
export async function updateUsername(username) {
  return api.patch('/auth/username', { username });
}
