// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';
import { getToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar, si hay token guardado verificamos que sigue válido
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => setUser(userData);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = (fields) =>
    setUser(prev => ({ ...prev, ...fields }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de conveniencia
export const useAuth = () => useContext(AuthContext);
