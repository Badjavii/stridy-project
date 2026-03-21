// ─── CALENDAR ─────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { useApp }  from '../../store/AppContext';
import { createEvent, updateEvent, deleteEvent } from '../../api/events';
import styles from './Calendar.module.css';

const DAYS   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const TYPE_OPTIONS = [
  { value: 'exam',     label: 'Examen' },
  { value: 'deadline', label: 'Entrega' },
  { value: 'class',    label: 'Clase' },
  { value: 'study',    label: 'Estudio' },
];

const TYPE_COLORS = {
  exam:     'var(--red)',
  deadline: 'var(--yellow)',
  class:    'var(--blue)',
  study:    'var(--accent)',
};

const EMPTY_FORM = { title: '', date: '', type: 'exam', subject_id: '' };

export default function Calendar() {
  const { events, subjects, institutions, addEvent, editEvent, removeEvent } = useApp();

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);  // fecha seleccionada 'YYYY-MM-DD'
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Navegar meses
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Construir días del mes
  const days = useMemo(() => {
    const first   = new Date(year, month, 1);
    const last    = new Date(year, month + 1, 0);
    // Lunes = 0 ... Domingo = 6
    const startDay = (first.getDay() + 6) % 7;
    const cells = [];
    // Días del mes anterior
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, -startDay + i + 1);
      cells.push({ date: d, current: false });
    }
    // Días del mes actual
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), current: true });
    }
    // Rellenar hasta completar grilla
    while (cells.length % 7 !== 0)  {
      const d = new Date(year, month + 1, cells.length - last.getDate() - startDay + 1);
      cells.push({ date: d, current: false });
    }
    return cells;
  }, [year, month]);

  // Eventos por fecha
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const toDateStr = (d) => d.toISOString().split('T')[0];
  const isToday   = (d) => toDateStr(d) === toDateStr(today);

  // Eventos del día seleccionado
  const selectedEvents = selected ? (eventsByDate[selected] ?? []) : [];

  const openCreate = (dateStr) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: dateStr ?? '' });
    setError('');
    setModal(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({ title: ev.title, date: ev.date, type: ev.type, subject_id: ev.subject_id ?? '' });
    setError('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    if (!form.date)         { setError('La fecha es obligatoria'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title:      form.title,
        date:       form.date,
        type:       form.type,
        subject_id: form.subject_id || null,
      };
      if (editing) {
        const updated = await updateEvent(editing.id, payload);
        editEvent(editing.id, updated);
      } else {
        const created = await createEvent(payload);
        addEvent(created);
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await deleteEvent(id);
      removeEvent(id);
      setSelected(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const getInst = (ev) => {
    const sub = subjects.find(s => s.id === ev.subject_id);
    return sub ? institutions.find(i => i.id === sub.institution_id) : null;
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={prevMonth}>◀</button>
          <h1 className={styles.title}>
            {MONTHS[month]} {year}
          </h1>
          <button className={styles.navBtn} onClick={nextMonth}>▶</button>
        </div>
        <button className={styles.btnPrimary} onClick={() => openCreate('')}>
          + Evento
        </button>
      </div>

      <div className={styles.layout}>

        {/* Grilla */}
        <div className={styles.calWrap}>
          {/* Cabecera días */}
          <div className={styles.calHead}>
            {DAYS.map(d => (
              <div key={d} className={styles.calHeadCell}>{d}</div>
            ))}
          </div>

          {/* Días */}
          <div className={styles.calGrid}>
            {days.map((cell, i) => {
              const dateStr   = toDateStr(cell.date);
              const dayEvents = eventsByDate[dateStr] ?? [];
              const isSel     = selected === dateStr;
              const isTod     = isToday(cell.date);

              return (
                <div
                  key={i}
                  className={`
                    ${styles.calCell}
                    ${!cell.current ? styles.calCellOther : ''}
                    ${isTod ? styles.calCellToday : ''}
                    ${isSel ? styles.calCellSelected : ''}
                  `}
                  onClick={() => setSelected(isSel ? null : dateStr)}
                >
                  <span className={`${styles.calNum} ${isTod ? styles.calNumToday : ''}`}>
                    {cell.date.getDate()}
                  </span>
                  <div className={styles.calEvents}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className={styles.calChip}
                        style={{ background: `${TYPE_COLORS[ev.type]}25`, color: TYPE_COLORS[ev.type] }}
                        onClick={e => { e.stopPropagation(); setSelected(dateStr); }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className={styles.calMore}>+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral — eventos del día seleccionado */}
        <div className={styles.panel}>
          {selected ? (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    {new Date(selected + 'T12:00').toLocaleDateString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </h3>
                  <p className={styles.panelSub}>{selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  className={styles.btnPrimary}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => openCreate(selected)}
                >
                  + Añadir
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <div className={styles.panelEmpty}>
                  <p>Sin eventos este día</p>
                  <button className={styles.btnSecondary} onClick={() => openCreate(selected)}>
                    + Crear evento
                  </button>
                </div>
              ) : (
                <div className={styles.panelEvents}>
                  {selectedEvents.map(ev => {
                    const inst  = getInst(ev);
                    const color = TYPE_COLORS[ev.type] ?? 'var(--accent)';
                    const typeLabel = TYPE_OPTIONS.find(t => t.value === ev.type)?.label ?? ev.type;
                    return (
                      <div key={ev.id} className={styles.evCard}>
                        <div className={styles.evCardBar} style={{ background: color }} />
                        <div className={styles.evCardContent}>
                          <div className={styles.evCardTop}>
                            <span className={styles.evCardTitle}>{ev.title}</span>
                            <div className={styles.evCardActions}>
                              <button className={styles.iconBtn} onClick={() => openEdit(ev)}>✎</button>
                              <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(ev.id)}>✕</button>
                            </div>
                          </div>
                          <div className={styles.evCardMeta}>
                            <span
                              className={styles.chip}
                              style={{ background: `${color}20`, color }}
                            >
                              {typeLabel}
                            </span>
                            {inst && (
                              <span className={`${styles.chip} ${styles.chipMuted}`}>
                                {inst.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={styles.panelPlaceholder}>
              <span className={styles.panelPlaceholderIcon}>📅</span>
              <p>Selecciona un día para ver o añadir eventos</p>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        {TYPE_OPTIONS.map(t => (
          <div key={t.value} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: TYPE_COLORS[t.value] }} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Editar evento' : 'Nuevo evento'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Título *</label>
                <input
                  className={styles.input}
                  placeholder="Ej: Parcial Cálculo II"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo</label>
                  <select
                    className={styles.input}
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  >
                    {TYPE_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Materia (opcional)</label>
                <select
                  className={styles.input}
                  value={form.subject_id}
                  onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
                >
                  <option value="">Sin materia</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : editing ? 'Guardar' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
