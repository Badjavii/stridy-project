// ─── DASHBOARD ────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useApp }  from '../../store/AppContext';
import styles      from './Dashboard.module.css';

// Calcula cuánto necesita un estudiante para aprobar una materia
function calcNeeded(subject) {
  const grades  = subject.grades ?? [];
  const pending = subject.pending_grades ?? [];
  const doneWeight    = grades.reduce((s, g) => s + g.weight, 0);
  const weightedSum   = grades.reduce((s, g) => s + g.score * g.weight, 0);
  const remainWeight  = pending.reduce((s, g) => s + g.weight, 0);
  const currentAvg    = doneWeight > 0 ? weightedSum / doneWeight : 0;
  const needed        = remainWeight > 0
    ? (subject.passing_grade * 100 - weightedSum) / remainWeight
    : null;
  const canPass = (weightedSum + remainWeight * 10) / 100 >= subject.passing_grade;
  return { currentAvg, needed, canPass, doneWeight };
}

export default function Dashboard() {
  const { user }                                    = useAuth();
  const { institutions, subjects, events, friends } = useApp();
  const navigate                                    = useNavigate();

  const today = new Date();
  const hour  = today.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Materias en riesgo
  const atRisk = useMemo(() =>
    subjects.filter(s => !calcNeeded(s).canPass), [subjects]);

  // Próximos eventos ordenados
  const upcoming = useMemo(() =>
    [...events]
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [events]);

  // Top materias con su promedio
  const subjectRows = useMemo(() =>
    subjects.slice(0, 5).map(s => ({
      ...s,
      inst: institutions.find(i => i.id === s.institution_id),
      ...calcNeeded(s),
    })),
    [subjects, institutions]);

  const diffDays = (dateStr) => {
    const d = Math.ceil((new Date(dateStr) - today) / 86400000);
    if (d === 0) return { label: 'Hoy',    cls: styles.chipRed };
    if (d === 1) return { label: 'Mañana', cls: styles.chipRed };
    if (d <= 7)  return { label: `${d}d`,  cls: styles.chipYellow };
    return             { label: `${d}d`,   cls: styles.chipBlue };
  };

  const TYPE_LABELS = {
    exam:     'Examen',
    deadline: 'Entrega',
    class:    'Clase',
    study:    'Estudio',
  };

  return (
    <div className={styles.page}>

      {/* ── Saludo ── */}
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>
            {greeting}, {user?.username} ✦
          </h1>
          <p className={styles.greetSub}>
            {today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Instituciones</span>
          <span className={styles.statValue} style={{ color: 'var(--accent)' }}>
            {institutions.length}
          </span>
          <span className={styles.statSub}>{subjects.length} materias activas</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Próximas evaluaciones</span>
          <span className={styles.statValue} style={{ color: 'var(--yellow)' }}>
            {upcoming.filter(e => e.type === 'exam' || e.type === 'deadline').length}
          </span>
          <span className={styles.statSub}>
            Esta semana: {upcoming.filter(e => {
              const d = Math.ceil((new Date(e.date) - today) / 86400000);
              return d <= 7;
            }).length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Materias en riesgo</span>
          <span className={styles.statValue} style={{ color: atRisk.length > 0 ? 'var(--red)' : 'var(--green)' }}>
            {atRisk.length}
          </span>
          <span className={styles.statSub}>
            {atRisk.length > 0 ? 'Requieren atención' : 'Todo bajo control'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Amigos</span>
          <span className={styles.statValue} style={{ color: 'var(--blue)' }}>
            {friends.length}
          </span>
          <span className={styles.statSub}>
            {friends.filter(f => f.online).length} en línea
          </span>
        </div>
      </div>

      {/* ── Instituciones ── */}
      {institutions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Mis instituciones</h2>
            <button className={styles.linkBtn} onClick={() => navigate('/institutions')}>
              Ver todas →
            </button>
          </div>
          <div className={styles.instGrid}>
            {institutions.map(inst => {
              const instSubjects = subjects.filter(s => s.institution_id === inst.id);
              const avg = instSubjects.length > 0
                ? instSubjects.reduce((s, sub) => s + calcNeeded(sub).currentAvg, 0) / instSubjects.length
                : 0;
              return (
                <div
                  key={inst.id}
                  className={styles.instCard}
                  onClick={() => navigate(`/subjects?institution_id=${inst.id}`)}
                >
                  <div className={styles.instBar} style={{ background: inst.color }} />
                  <div className={styles.instIcon} style={{ background: `${inst.color}20` }}>
                    🎓
                  </div>
                  <div className={styles.instName}>{inst.name}</div>
                  <div className={styles.instProg}>{inst.program}</div>
                  <div className={styles.instFooter}>
                    <span className={styles.instCount}>{instSubjects.length} materias</span>
                    <span className={`${styles.chip} ${avg >= inst.passing_grade ? styles.chipGreen : styles.chipYellow}`}>
                      {avg.toFixed(1)} avg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Bottom grid ── */}
      <div className={styles.bottomGrid}>

        {/* Materias */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Materias</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/subjects')}>
              Ver todas →
            </button>
          </div>

          {subjectRows.length === 0 && (
            <div className={styles.empty}>
              <p>Sin materias aún.</p>
              <button className={styles.btnPrimary} onClick={() => navigate('/subjects')}>
                + Añadir materia
              </button>
            </div>
          )}

          {subjectRows.map(s => (
            <div
              key={s.id}
              className={styles.subjRow}
              onClick={() => navigate(`/subjects/${s.id}`)}
            >
              <span className={styles.subjDot} style={{ background: s.color ?? s.inst?.color }} />
              <div className={styles.subjInfo}>
                <span className={styles.subjName}>{s.name}</span>
                <span className={styles.subjInst}>{s.inst?.name}</span>
                <div className={styles.progress}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min((s.currentAvg / 10) * 100, 100)}%`,
                      background: s.color ?? s.inst?.color,
                    }}
                  />
                </div>
              </div>
              <span
                className={styles.subjAvg}
                style={{ color: s.canPass ? 'var(--green)' : 'var(--red)' }}
              >
                {s.currentAvg.toFixed(1)}
              </span>
              <span className={`${styles.chip} ${s.canPass ? styles.chipGreen : styles.chipRed}`}>
                {s.canPass ? '✓' : '⚠'}
              </span>
            </div>
          ))}
        </div>

        {/* Próximas evaluaciones */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Próximas evaluaciones</h3>
            <button className={styles.linkBtn} onClick={() => navigate('/calendar')}>
              Ver calendario →
            </button>
          </div>

          {upcoming.length === 0 && (
            <div className={styles.empty}>
              <p>Sin eventos próximos.</p>
              <button className={styles.btnPrimary} onClick={() => navigate('/calendar')}>
                + Añadir evento
              </button>
            </div>
          )}

          {upcoming.map(ev => {
            const d    = new Date(ev.date);
            const diff = diffDays(ev.date);
            const inst = institutions.find(i =>
              subjects.find(s => s.id === ev.subject_id && s.institution_id === i.id)
            );
            return (
              <div key={ev.id} className={styles.evRow}>
                <div className={styles.evDate}>
                  <span className={styles.evDay}>{d.getDate()}</span>
                  <span className={styles.evMonth}>
                    {d.toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
                <div
                  className={styles.evBar}
                  style={{ background: inst?.color ?? 'var(--accent)' }}
                />
                <div className={styles.evInfo}>
                  <span className={styles.evTitle}>{ev.title}</span>
                  <span className={styles.evSub}>
                    {inst?.name ?? 'Sin asignatura'} · {TYPE_LABELS[ev.type] ?? ev.type}
                  </span>
                </div>
                <span className={`${styles.chip} ${diff.cls}`}>{diff.label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
