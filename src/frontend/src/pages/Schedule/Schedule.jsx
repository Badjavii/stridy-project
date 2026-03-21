// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { createSlot, updateSlot, deleteSlot } from '../../api/schedule';
import styles from './Schedule.module.css';

const DAYS = [
  { label: 'Lunes',     value: 1 },
  { label: 'Martes',    value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves',    value: 4 },
  { label: 'Viernes',   value: 5 },
  { label: 'Sábado',    value: 6 },
  { label: 'Domingo',   value: 7 },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am a 9pm

const EMPTY_FORM = {
  subject_id:  '',
  day_of_week: '1',
  start_time:  '08:00',
  end_time:    '10:00',
};

// Convierte "08:30" a minutos desde medianoche
const toMins  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtHour = (h) => `${String(h).padStart(2, '0')}:00`;

export default function Schedule() {
  const { schedule, subjects, institutions, addSlot, editSlot, removeSlot } = useApp();

  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [deleting, setDeleting] = useState(null);

  // Hoy — para resaltar columna actual
  const todayCol = new Date().getDay() || 7; // 1=lun...7=dom

  // Agrupar slots por día
  const slotsByDay = useMemo(() => {
    const map = {};
    DAYS.forEach(d => { map[d.value] = []; });
    schedule.forEach(slot => {
      if (map[slot.day_of_week]) map[slot.day_of_week].push(slot);
    });
    return map;
  }, [schedule]);

  // Detectar choques (dos slots en el mismo día se solapan)
  const clashes = useMemo(() => {
    const ids = new Set();
    DAYS.forEach(d => {
      const slots = [...slotsByDay[d.value]].sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
      for (let i = 0; i < slots.length - 1; i++) {
        if (toMins(slots[i].end_time) > toMins(slots[i + 1].start_time)) {
          ids.add(slots[i].id);
          ids.add(slots[i + 1].id);
        }
      }
    });
    return ids;
  }, [slotsByDay]);

  const openCreate = (day = '1') => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, day_of_week: String(day) });
    setError('');
    setModal(true);
  };

  const openEdit = (slot) => {
    setEditing(slot);
    setForm({
      subject_id:  slot.subject_id,
      day_of_week: String(slot.day_of_week),
      start_time:  slot.start_time,
      end_time:    slot.end_time,
    });
    setError('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) { setError('Selecciona una materia'); return; }
    if (form.start_time >= form.end_time) { setError('La hora de fin debe ser mayor a la de inicio'); return; }

    setLoading(true);
    setError('');
    try {
      const payload = {
        subject_id:  form.subject_id,
        day_of_week: parseInt(form.day_of_week),
        start_time:  form.start_time,
        end_time:    form.end_time,
      };
      if (editing) {
        const updated = await updateSlot(editing.id, payload);
        editSlot(editing.id, updated);
      } else {
        const created = await createSlot(payload);
        addSlot(created);
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteSlot(id);
      removeSlot(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Posición y altura de un slot en la grilla (cada hora = 56px)
  const slotStyle = (slot) => {
    const startMins = toMins(slot.start_time) - 7 * 60;
    const durMins   = toMins(slot.end_time) - toMins(slot.start_time);
    return {
      top:    `${(startMins / 60) * 56}px`,
      height: `${Math.max((durMins / 60) * 56 - 4, 24)}px`,
    };
  };

  const getSubject = (id) => subjects.find(s => s.id === id);
  const getInst    = (sub) => sub ? institutions.find(i => i.id === sub.institution_id) : null;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Horario semanal</h1>
          <p className={styles.sub}>
            {schedule.length} clases · {clashes.size > 0
              ? <span style={{ color: 'var(--red)' }}>⚠ {clashes.size / 2} choque{clashes.size / 2 !== 1 ? 's' : ''} detectado{clashes.size / 2 !== 1 ? 's' : ''}</span>
              : 'Sin choques'}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => openCreate()}>
          + Añadir clase
        </button>
      </div>

      {/* Grilla */}
      <div className={styles.gridWrap}>
        <div className={styles.grid}>

          {/* Columna de horas */}
          <div className={styles.timeCol}>
            <div className={styles.timeHead} />
            {HOURS.map(h => (
              <div key={h} className={styles.timeCell}>
                {fmtHour(h)}
              </div>
            ))}
          </div>

          {/* Columnas por día */}
          {DAYS.map(day => (
            <div key={day.value} className={styles.dayCol}>
              <div className={`${styles.dayHead} ${day.value === todayCol ? styles.dayHeadToday : ''}`}>
                {day.label}
                <button
                  className={styles.addDayBtn}
                  onClick={() => openCreate(day.value)}
                  title={`Añadir clase el ${day.label}`}
                >+</button>
              </div>

              {/* Celdas de fondo (una por hora) */}
              <div className={styles.dayCells}>
                {HOURS.map(h => (
                  <div key={h} className={styles.hourCell} />
                ))}

                {/* Slots posicionados absolutamente */}
                {slotsByDay[day.value].map(slot => {
                  const sub   = getSubject(slot.subject_id);
                  const inst  = getInst(sub);
                  const color = sub?.color ?? inst?.color ?? 'var(--accent)';
                  const clash = clashes.has(slot.id);

                  return (
                    <div
                      key={slot.id}
                      className={`${styles.slot} ${clash ? styles.slotClash : ''}`}
                      style={{
                        ...slotStyle(slot),
                        background: `${color}25`,
                        borderColor: clash ? 'var(--red)' : color,
                        color,
                      }}
                      onClick={() => openEdit(slot)}
                    >
                      <span className={styles.slotName}>{sub?.name ?? 'Sin materia'}</span>
                      <span className={styles.slotTime}>
                        {slot.start_time} – {slot.end_time}
                      </span>
                      {clash && <span className={styles.slotClashIcon}>⚠</span>}
                      <button
                        className={styles.slotDelete}
                        onClick={e => { e.stopPropagation(); handleDelete(slot.id); }}
                        disabled={deleting === slot.id}
                      >
                        {deleting === slot.id ? '…' : '✕'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Editar clase' : 'Nueva clase'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>

              <div className={styles.formGroup}>
                <label className={styles.label}>Materia *</label>
                <select
                  className={styles.input}
                  value={form.subject_id}
                  onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
                >
                  <option value="">Selecciona materia...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Día *</label>
                <select
                  className={styles.input}
                  value={form.day_of_week}
                  onChange={e => setForm(p => ({ ...p, day_of_week: e.target.value }))}
                >
                  {DAYS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hora inicio *</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hora fin *</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading
                    ? <span className={styles.spinner} />
                    : editing ? 'Guardar' : 'Añadir clase'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
