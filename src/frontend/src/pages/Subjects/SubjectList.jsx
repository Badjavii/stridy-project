// ─── SUBJECT LIST ─────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { createSubject, deleteSubject } from '../../api/subjects';
import styles from './Subjects.module.css';

const EMPTY_FORM = {
  institution_id: '',
  name: '',
  color: '#7c6ef5',
  credits: '',
  passing_grade: '',
};

const COLORS = [
  '#7c6ef5', '#4da6ff', '#34c97a',
  '#f0b429', '#e8534e', '#f472b6', '#fb923c',
];

function calcNeeded(subject) {
  const grades  = subject.grades  ?? [];
  const pending = subject.pending_grades ?? [];
  const doneWeight  = grades.reduce((s, g) => s + g.weight, 0);
  const weightedSum = grades.reduce((s, g) => s + g.score * g.weight, 0);
  const remainWeight = pending.reduce((s, g) => s + g.weight, 0);
  const currentAvg  = doneWeight > 0 ? weightedSum / doneWeight : 0;
  const needed      = remainWeight > 0
    ? (subject.passing_grade * 100 - weightedSum) / remainWeight
    : null;
  const canPass = (weightedSum + remainWeight * 10) / 100 >= subject.passing_grade;
  return { currentAvg, needed, canPass };
}

export default function SubjectList() {
  const { institutions, subjects, addSubject, removeSubject } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterInstId = searchParams.get('institution_id');

  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({
    ...EMPTY_FORM,
    institution_id: filterInstId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]   = useState('');

  // Filtrar por institución si viene en la URL
  const filtered = useMemo(() => {
    let list = filterInstId
      ? subjects.filter(s => s.institution_id === filterInstId)
      : subjects;
    if (search.trim())
      list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [subjects, filterInstId, search]);

  const currentInst = institutions.find(i => i.id === filterInstId);

  const openModal = () => {
    setForm({ ...EMPTY_FORM, institution_id: filterInstId ?? '' });
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())           { setError('El nombre es obligatorio'); return; }
    if (!form.institution_id)        { setError('Selecciona una institución'); return; }
    if (!form.credits || form.credits < 1) { setError('Los créditos deben ser mayor a 0'); return; }
    if (!form.passing_grade)         { setError('La nota mínima es obligatoria'); return; }

    setLoading(true);
    setError('');
    try {
      const created = await createSubject({
        ...form,
        credits:       parseInt(form.credits),
        passing_grade: parseFloat(form.passing_grade),
      });
      addSubject(created);
      setModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta materia y todas sus notas?')) return;
    setDeleting(id);
    try {
      await deleteSubject(id);
      removeSubject(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {currentInst ? currentInst.name : 'Todas las materias'}
          </h1>
          <p className={styles.sub}>
            {currentInst?.program ?? `${subjects.length} materias en total`}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={openModal}>
          + Nueva materia
        </button>
      </div>

      {/* Buscador */}
      <input
        className={styles.search}
        placeholder="Buscar materia..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📚</span>
          <h3>Sin materias</h3>
          <p>{search ? 'No hay resultados para tu búsqueda' : 'Añade tu primera materia'}</p>
          {!search && (
            <button className={styles.btnPrimary} onClick={openModal}>
              + Nueva materia
            </button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(s => {
            const inst  = institutions.find(i => i.id === s.institution_id);
            const color = s.color ?? inst?.color ?? 'var(--accent)';
            const { currentAvg, needed, canPass } = calcNeeded(s);

            return (
              <div
                key={s.id}
                className={styles.row}
                onClick={() => navigate(`/subjects/${s.id}`)}
              >
                <div className={styles.rowLeft}>
                  <span className={styles.dot} style={{ background: color }} />
                  <div className={styles.rowInfo}>
                    <span className={styles.rowName}>{s.name}</span>
                    <span className={styles.rowMeta}>
                      {inst?.name} · {s.credits} créditos · Mín. {s.passing_grade}
                    </span>
                    <div className={styles.progress}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min((currentAvg / 10) * 100, 100)}%`, background: color }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.rowRight}>
                  <span
                    className={styles.avg}
                    style={{ color: canPass ? 'var(--green)' : 'var(--red)' }}
                  >
                    {currentAvg.toFixed(1)}
                  </span>

                  {needed !== null && needed > 0 && needed <= 10 && (
                    <span className={styles.needed}>
                      Necesitas {needed.toFixed(1)}
                    </span>
                  )}

                  <span className={`${styles.chip} ${canPass ? styles.chipGreen : styles.chipRed}`}>
                    {canPass ? '✓ ok' : '⚠ riesgo'}
                  </span>

                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(s.id, e)}
                    disabled={deleting === s.id}
                    title="Eliminar"
                  >
                    {deleting === s.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva materia */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva materia</h2>
              <button className={styles.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Institución *</label>
                <select
                  className={styles.input}
                  value={form.institution_id}
                  onChange={e => setForm(p => ({ ...p, institution_id: e.target.value }))}
                >
                  <option value="">Selecciona institución...</option>
                  {institutions.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre *</label>
                <input
                  className={styles.input}
                  placeholder="Ej: Cálculo II"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Créditos *</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    max="20"
                    placeholder="4"
                    value={form.credits}
                    onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nota mínima *</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="3.0"
                    value={form.passing_grade}
                    onChange={e => setForm(p => ({ ...p, passing_grade: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Color</label>
                <div className={styles.colorRow}>
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className={`${styles.swatch} ${form.color === c ? styles.swatchActive : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm(p => ({ ...p, color: c }))}
                    />
                  ))}
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'Crear materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
