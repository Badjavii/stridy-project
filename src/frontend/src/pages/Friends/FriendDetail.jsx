// ─── FRIEND DETAIL ────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp }  from '../../store/AppContext';
import { deleteFriend }         from '../../api/friends';
import { getFriendSubjects, getFriendEvents, getFriendSchedule } from '../../api/friends';
import styles from './Friends.module.css';

const TABS = [
  { id: 'subjects',  label: 'Materias' },
  { id: 'calendar',  label: 'Calendario' },
  { id: 'schedule',  label: 'Horario' },
];

const TYPE_COLORS = {
  exam:     'var(--red)',
  deadline: 'var(--yellow)',
  class:    'var(--blue)',
  study:    'var(--accent)',
};

const DAYS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function FriendDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { friends, subjects: mySubjects, removeFriend } = useApp();

  const friend = friends.find(f => f.id === id);

  const [tab,       setTab]       = useState('subjects');
  const [fSubjects, setFSubjects] = useState([]);
  const [fEvents,   setFEvents]   = useState([]);
  const [fSchedule, setFSchedule] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    if (!friend) return;
    setLoading(true);
    Promise.all([
      getFriendSubjects(id),
      getFriendEvents(id),
      getFriendSchedule(id),
    ])
      .then(([subs, evs, sch]) => {
        setFSubjects(subs);
        setFEvents(evs);
        setFSchedule(sch);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a ${friend?.username} de tus amigos?`)) return;
    setDeleting(true);
    try {
      await deleteFriend(id);
      removeFriend(id);
      navigate('/friends');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  // Materias en común
  const common = fSubjects.filter(fs =>
    mySubjects.some(ms => ms.name.toLowerCase() === fs.name.toLowerCase())
  );

  const initials = (u) => u?.replace('@', '').slice(0, 2).toUpperCase() ?? '??';

  if (!friend) return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/friends')}>← Volver</button>
      <p className={styles.sub}>Amigo no encontrado.</p>
    </div>
  );

  const upcoming = [...fEvents]
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  return (
    <div className={styles.page}>

      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate('/friends')}>
        ← Amigos
      </button>

      {/* Perfil */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.profileAvatarWrap}>
            <div className={styles.profileAvatar}>{initials(friend.username)}</div>
            <span
              className={styles.onlineDot}
              style={{ background: friend.online ? 'var(--green)' : 'var(--border-2)', width: 10, height: 10 }}
            />
          </div>
          <div>
            <h1 className={styles.profileName}>{friend.username}</h1>
            <p className={styles.profileMeta}>
              {friend.online ? 'En línea' : 'Desconectado'}
              {common.length > 0 && ` · ${common.length} materia${common.length !== 1 ? 's' : ''} en común`}
            </p>
          </div>
        </div>
        <button
          className={styles.btnDanger}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : 'Eliminar amigo'}
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${tab === t.id ? styles.tabBtnActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'subjects' && fSubjects.length > 0 && (
              <span className={styles.tabCount}>{fSubjects.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className={styles.loadingRow}>
          <div className={styles.spinnerSm} />
          <span>Cargando...</span>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* ── Tab: Materias ── */}
      {!loading && tab === 'subjects' && (
        <div className={styles.tabContent}>
          {fSubjects.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>Este amigo no tiene materias visibles</p>
            </div>
          ) : (
            <>
              {common.length > 0 && (
                <div className={styles.commonSection}>
                  <h3 className={styles.commonTitle}>En común contigo</h3>
                  {common.map(s => {
                    const mine = mySubjects.find(ms => ms.name.toLowerCase() === s.name.toLowerCase());
                    const color = s.color ?? 'var(--accent)';
                    return (
                      <div key={s.id} className={`${styles.subjRow} ${styles.subjRowCommon}`}>
                        <span className={styles.subjDot} style={{ background: color }} />
                        <div className={styles.subjInfo}>
                          <span className={styles.subjName}>{s.name}</span>
                          <span className={styles.subjMeta}>
                            Él/ella: <strong style={{ color }}>{s.current_avg?.toFixed(1) ?? '—'}</strong>
                            {mine && <> · Tú: <strong>{mine.current_avg?.toFixed(1) ?? '—'}</strong></>}
                          </span>
                        </div>
                        <span className={`${styles.chip} ${styles.chipAccent}`}>En común</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className={styles.commonTitle}>Todas sus materias</h3>
              {fSubjects.map(s => {
                const color = s.color ?? 'var(--accent)';
                return (
                  <div key={s.id} className={styles.subjRow}>
                    <span className={styles.subjDot} style={{ background: color }} />
                    <div className={styles.subjInfo}>
                      <span className={styles.subjName}>{s.name}</span>
                      <span className={styles.subjMeta}>{s.institution_name ?? ''}</span>
                    </div>
                    <span className={styles.subjAvg} style={{ color }}>
                      {s.current_avg?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Calendario ── */}
      {!loading && tab === 'calendar' && (
        <div className={styles.tabContent}>
          {upcoming.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>Sin eventos próximos</p>
            </div>
          ) : (
            upcoming.map(ev => {
              const d     = new Date(ev.date + 'T12:00');
              const color = TYPE_COLORS[ev.type] ?? 'var(--accent)';
              const diff  = Math.ceil((new Date(ev.date) - new Date()) / 86400000);
              return (
                <div key={ev.id} className={styles.evRow}>
                  <div className={styles.evDate}>
                    <span className={styles.evDay}>{d.getDate()}</span>
                    <span className={styles.evMonth}>
                      {d.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                  </div>
                  <div className={styles.evBar} style={{ background: color }} />
                  <div className={styles.evInfo}>
                    <span className={styles.evTitle}>{ev.title}</span>
                    <span className={styles.evMeta}>{ev.subject_name ?? 'Sin materia'}</span>
                  </div>
                  <span
                    className={styles.chip}
                    style={{ background: `${color}20`, color }}
                  >
                    {diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : `${diff}d`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Horario ── */}
      {!loading && tab === 'schedule' && (
        <div className={styles.tabContent}>
          {fSchedule.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>Sin horario registrado</p>
            </div>
          ) : (
            <div className={styles.scheduleList}>
              {[1,2,3,4,5,6,7].map(day => {
                const daySlots = fSchedule.filter(s => s.day_of_week === day);
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className={styles.scheduleDay}>
                    <h4 className={styles.scheduleDayLabel}>{DAYS[day]}</h4>
                    {daySlots
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map(slot => {
                        const color = slot.color ?? 'var(--accent)';
                        return (
                          <div key={slot.id} className={styles.scheduleSlot}>
                            <div
                              className={styles.scheduleSlotBar}
                              style={{ background: color }}
                            />
                            <div className={styles.scheduleSlotInfo}>
                              <span className={styles.scheduleSlotName}>{slot.subject_name}</span>
                              <span className={styles.scheduleSlotTime}>
                                {slot.start_time} – {slot.end_time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
