// ─── BOTTOM NAV (móvil) ───────────────────────────────────────────────────────
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const ITEMS = [
  { to: '/',         label: 'Inicio',     icon: '⌂',  end: true },
  { to: '/calendar', label: 'Calendario', icon: '📅' },
  { to: '/tests',    label: 'Tests',      icon: '🧠' },
  { to: '/copilot',  label: 'Copiloto',   icon: '✦' },
];

export default function BottomNav() {
  return (
    <div className={styles.nav}>
      {ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
