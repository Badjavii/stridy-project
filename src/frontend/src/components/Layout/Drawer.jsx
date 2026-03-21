// ─── DRAWER (móvil) ───────────────────────────────────────────────────────────
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useApp }  from '../../store/AppContext';
import styles      from './Drawer.module.css';

const NAV_ITEMS = [
  { to: '/',           label: 'Inicio',      icon: '⌂',  end: true },
  { to: '/calendar',   label: 'Calendario',  icon: '📅' },
  { to: '/schedule',   label: 'Horario',     icon: '🗓' },
  { to: '/tests',      label: 'Tests IA',    icon: '🧠' },
  { to: '/copilot',    label: 'Copiloto IA', icon: '✦' },
];

export default function Drawer({ open, onClose }) {
  const { user, logout }          = useAuth();
  const { institutions, friends } = useApp();
  const navigate                  = useNavigate();

  const go = (path) => { navigate(path); onClose(); };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>

        <div className={styles.header}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.logoName}>Stridy</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          {/* Nav general */}
          <div className={styles.sectionLabel}>General</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.item} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Instituciones */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Instituciones</span>
            <button className={styles.addBtn} onClick={() => go('/institutions')}>+</button>
          </div>

          {institutions.map(inst => (
            <div
              key={inst.id}
              className={styles.item}
              onClick={() => go(`/subjects?institution_id=${inst.id}`)}
            >
              <span className={styles.dot} style={{ background: inst.color }} />
              <span className={styles.instName}>{inst.name}</span>
              <span className={styles.count}>{inst.subject_count ?? 0}</span>
            </div>
          ))}

          {/* Amigos */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Amigos</span>
            <button className={styles.addBtn} onClick={() => go('/friends')}>+</button>
          </div>

          {friends.map(friend => (
            <div
              key={friend.id}
              className={styles.friendItem}
              onClick={() => go(`/friends/${friend.id}`)}
            >
              <div className={styles.friendAvatar}>
                {friend.username.slice(1, 3).toUpperCase()}
              </div>
              <span className={styles.friendName}>{friend.username}</span>
              <span
                className={styles.friendStatus}
                style={{ background: friend.online ? 'var(--green)' : 'var(--border-2)' }}
              />
            </div>
          ))}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.userCard} onClick={handleLogout}>
            <div className={styles.userAvatar}>
              {user?.username?.slice(1, 3).toUpperCase() ?? 'ST'}
            </div>
            <div>
              <div className={styles.userName}>{user?.username}</div>
              <div className={styles.userSub}>Cerrar sesión</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
