// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../../api/auth';
import { useAuth }  from '../../store/AuthContext';
import { useApp }   from '../../store/AppContext';
import styles       from './Auth.module.css';

export default function Login() {
  const [key, setKey]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { login }   = useAuth();
  const { loadAll } = useApp();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = key.replace(/[-\s]/g, '');
    if (cleaned.length !== 16) {
      setError('La clave debe tener exactamente 16 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginApi(cleaned);
      login(data.user);
      await loadAll();
      navigate('/');
    } catch (err) {
      setError('Clave incorrecta. Verifica e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear input con guiones cada 4 chars para legibilidad
  const handleKeyChange = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join('-') ?? raw;
    setKey(formatted);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>S</span>
        </div>
        <h1 className={styles.title}>Bienvenido a Stridy</h1>
        <p className={styles.subtitle}>
          Ingresa tu clave secreta de 16 caracteres para acceder.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrap}>
            <input
              className={`${styles.keyInput} ${error ? styles.inputError : ''}`}
              type="text"
              value={key}
              onChange={handleKeyChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              autoFocus
              spellCheck={false}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading || key.replace(/-/g, '').length < 16}
          >
            {loading
              ? <span className={styles.spinner} />
              : 'Entrar →'
            }
          </button>
        </form>

        <p className={styles.loginLink}>
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
