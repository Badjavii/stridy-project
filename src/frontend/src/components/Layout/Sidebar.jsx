// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useApp }  from '../../store/AppContext';
import styles      from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/',            label: 'Inicio',      icon: '⌂',  end: true },
  { to: '/calendar',   label: 'Calendario',  icon: '📅' },
  { to: '/schedule',   label: 'Horario',     icon: '🗓' },
  { to: '/tests',      label: 'Tests IA',    icon: '🧠' },
  { to: '/copilot',    label: 'Copiloto IA', icon: '✦' },
];

export default function Sidebar() {
  const { user, logout }           = useAuth();
  const { institutions, friends }  = useApp();
  const navigate                   = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.sidebar}>

      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>S</div>
        <span className={styles.logoName}>Stridy</span>
        <span className={styles.logoBeta}>beta</span>
      </div>

      {/* Nav principal */}
      <div className={styles.body}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>General</span>
        </div>

        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Instituciones */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Instituciones</span>
          <button
            className={styles.addBtn}
            onClick={() => navigate('/institutions')}
            title="Nueva institución"
          >+</button>
        </div>

        {institutions.map(inst => (
          <NavLink
            key={inst.id}
            to={`/subjects?institution_id=${inst.id}`}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span
              className={styles.dot}
              style={{ background: inst.color }}
            />
            <span className={styles.instName}>{inst.name}</span>
            <span className={styles.count}>{inst.subject_count ?? 0}</span>
          </NavLink>
        ))}

        {institutions.length === 0 && (
          <p className={styles.empty}>Sin instituciones aún</p>
        )}

        {/* Amigos */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Amigos</span>
          <button
            className={styles.addBtn}
            onClick={() => navigate('/friends')}
            title="Añadir amigo"
          >+</button>
        </div>

        {friends.map(friend => (
          <div
            key={friend.id}
            className={styles.friendItem}
            onClick={() => navigate(`/friends/${friend.id}`)}
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

        {friends.length === 0 && (
          <p className={styles.empty}>Sin amigos aún</p>
        )}
      </div>

      {/* Footer usuario */}
      <div className={styles.footer}>
        <div className={styles.userCard} onClick={handleLogout} title="Cerrar sesión">
          <div className={styles.userAvatar}>
            {user?.username?.slice(1, 3).toUpperCase() ?? 'ST'}
          </div>
          <div>
            <div className={styles.userName}>{user?.username ?? '@usuario'}</div>
            <div className={styles.userKey}>Cerrar sesión</div>
          </div>
        </div>
      </div>

    </div>
  );
}
