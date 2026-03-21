// ─── TOPBAR ───────────────────────────────────────────────────────────────────
import { useLocation } from 'react-router-dom';
import { useAuth }     from '../../store/AuthContext';
import styles          from './Topbar.module.css';

const TITLES = {
  '/':             'Inicio',
  '/calendar':     'Calendario',
  '/schedule':     'Horario',
  '/tests':        'Tests IA',
  '/copilot':      'Copiloto IA',
  '/institutions': 'Instituciones',
  '/subjects':     'Materias',
  '/friends':      'Amigos',
};

export default function Topbar({ onMenuClick }) {
  const { pathname }   = useLocation();
  const { user }       = useAuth();

  const title = TITLES[pathname] ?? 'Stridy';
  const hour  = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <header className={styles.topbar}>

      {/* Botón hamburguesa — solo visible en móvil */}
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menú">
        <span className={styles.menuBar} />
        <span className={`${styles.menuBar} ${styles.menuBarShort}`} />
        <span className={styles.menuBar} />
      </button>

      {/* Logo móvil */}
      <div className={styles.logoMobile}>
        <div className={styles.logoMark}>S</div>
        <span className={styles.logoName}>Stridy</span>
      </div>

      {/* Título desktop */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        {pathname === '/' && user && (
          <span className={styles.greeting}>
            {greeting}, {user.username} ✦
          </span>
        )}
      </div>

      <div className={styles.spacer} />

      {/* Avatar usuario — desktop */}
      <div className={styles.avatar}>
        {user?.username?.slice(1, 3).toUpperCase() ?? 'ST'}
      </div>

    </header>
  );
}
