// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth';
import { useAuth }  from '../../store/AuthContext';
import styles       from './Auth.module.css';

const STEPS = { WARNING: 'warning', KEY: 'key', DONE: 'done' };

export default function Register() {
  const [step, setStep]     = useState(STEPS.WARNING);
  const [key, setKey]       = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [userData, setUserData] = useState(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // Paso 1 → Paso 2: generar la clave
  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await register();
      setKey(data.access_key);
      setUserData(data);
      setStep(STEPS.KEY);
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    login({ username: userData.username });
    navigate('/');
  }

  // ── Paso 1: Advertencia ──────────────────────────────────────────────────────
  if (step === STEPS.WARNING) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🔑</span>
        </div>
        <h1 className={styles.title}>Antes de continuar</h1>
        <p className={styles.subtitle}>
          Stridy protege tu privacidad. No pedimos email ni contraseña.
        </p>

        <div className={styles.warningBox}>
          <div className={styles.warningRow}>
            <span className={styles.warningDot} />
            <p>Se te generará una <strong>clave secreta de 16 caracteres</strong> que es tu única forma de acceder.</p>
          </div>
          <div className={styles.warningRow}>
            <span className={styles.warningDot} />
            <p>Esta clave <strong>solo se muestra una vez</strong>. Si la pierdes no podemos recuperarla.</p>
          </div>
          <div className={styles.warningRow}>
            <span className={styles.warningDot} />
            <p>Guárdala en un lugar seguro antes de continuar.</p>
          </div>
          <div className={styles.warningRow}>
            <span className={styles.warningDot} style={{ background: 'var(--yellow)' }} />
            <p>Si no inicias sesión en <strong>6 meses</strong>, tu cuenta se eliminará automáticamente.</p>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btnPrimary}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <span className={styles.spinner} /> : '✓ Entendido, generar mi clave'}
        </button>

        <p className={styles.loginLink}>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );

  // ── Paso 2: Mostrar clave ────────────────────────────────────────────────────
  if (step === STEPS.KEY) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>✦</span>
        </div>
        <h1 className={styles.title}>Tu clave secreta</h1>
        <p className={styles.subtitle}>
          Cópiala ahora. No volverás a verla.
        </p>

        {/* La clave */}
        <div className={styles.keyBox}>
          <span className={styles.keyText}>{key}</span>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

        <div className={styles.infoBox}>
          <p>📋 Pégala en tu gestor de contraseñas, en una nota o en cualquier lugar seguro al que solo tú tengas acceso.</p>
        </div>

        <button
          className={styles.btnPrimary}
          onClick={handleContinue}
        >
          Ya la guardé, entrar a Stridy →
        </button>
      </div>
    </div>
  );
}
