// ─── API CLIENT ──────────────────────────────────────────────────────────────
// Todas las llamadas al backend pasan por aquí.
// Maneja JWT automáticamente y errores globales.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem('stridy_token');
export const setToken  = (token)   => localStorage.setItem('stridy_token', token);
export const clearToken = ()       => localStorage.removeItem('stridy_token');

// ─── Fetch base ───────────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, config);

  // Token expirado o inválido → limpiar sesión y redirigir
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    // El backend devuelve { error: 'mensaje' }
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data;
}

// ─── Métodos exportados ───────────────────────────────────────────────────────
export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
};
