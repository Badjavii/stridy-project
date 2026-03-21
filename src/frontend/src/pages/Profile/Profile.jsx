// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }       from '../../store/AuthContext';
import { updateUsername } from '../../api/auth';
import styles             from './Profile.module.css';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate                     = useNavigate();

  const [username, setUsername]   = useState(user?.username ?? '');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('El username no puede estar vacío'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formatted = username.startsWith('@') ? username : `@${username}`;
      await updateUsername(formatted);
      updateUser({ username: formatted });
      setSuccess('Username actualizado correctamente');
    } catch (err) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1 className={styles.title}>Perfil</h1>
      </div>

      {/* Avatar */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {user?.username?.slice(1, 3).toUpperCase() ?? 'ST'}
        </div>
        <div>
          <p className={styles.currentUsername}>{user?.username}</p>
          <p className={styles.joinDate}>
            Miembro desde {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>

      {/* Editar username */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Nombre de usuario</h2>
        <p className={styles.cardDesc}>
          Tu username es cómo te ven tus amigos en Stridy. Puedes cambiarlo cuando quieras.
        </p>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputGroup}>
            <span className={styles.inputPrefix}>@</span>
            <input
              className={styles.input}
              value={username.replace('@', '')}
              onChange={e => setUsername(e.target.value.replace('@', ''))}
              placeholder="tu_username"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {error   && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>✓ {success}</p>}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sesión</h2>
        <p className={styles.cardDesc}>
          Al cerrar sesión necesitarás tu clave de 16 caracteres para volver a entrar.
        </p>
        <button className={styles.btnDanger} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
