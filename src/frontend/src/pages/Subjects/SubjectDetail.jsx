// ─── SUBJECT DETAIL ───────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { updateSubject, updateSubjectNotes, deleteSubject } from '../../api/subjects';
import { createGrade, updateGrade, deleteGrade } from '../../api/grades';
import styles from './Subjects.module.css';

const COLORS = [
  '#7c6ef5','#4da6ff','#34c97a',
  '#f0b429','#e8534e','#f472b6','#fb923c',
];

const EMPTY_GRADE = { name: '', score: '', weight: '' };

function calcNeeded(subject) {
  const grades   = subject.grades         ?? [];
  const pending  = subject.pending_grades ?? [];
  const doneWeight  = grades.reduce((s, g) => s + g.weight, 0);
  const weightedSum = grades.reduce((s, g) => s + g.score * g.weight, 0);
  const remainWeight = pending.reduce((s, g) => s + g.weight, 0);
  const currentAvg   = doneWeight > 0 ? weightedSum / doneWeight : 0;
  const needed       = remainWeight > 0
    ? (subject.passing_grade * 100 - weightedSum) / remainWeight
    : null;
  const canPass = (weightedSum + remainWeight * 10) / 100 >= subject.passing_grade;
  const alreadyPassed = doneWeight >= 100 && currentAvg >= subject.passing_grade;
  return { currentAvg, needed, canPass, alreadyPassed, doneWeight, remainWeight };
}

export default function SubjectDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { institutions, subjects, editSubject, removeSubject, updateSubjectGrades } = useApp();

  const subject = subjects.find(s => s.id === id);
  const inst    = subject ? institutions.find(i => i.id === subject.institution_id) : null;
  const color   = subject?.color ?? inst?.color ?? 'var(--accent)';

  const info = useMemo(() => subject ? calcNeeded(subject) : null, [subject]);

  // ── Estados locales ──────────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [addingGrade, setAddingGrade] = useState(false);
  const [gradeForm, setGradeForm]     = useState(EMPTY_GRADE);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeError, setGradeError]   = useState('');

  const [notes, setNotes]           = useState(subject?.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const [deletingGrade, setDeletingGrade] = useState(null);

  if (!subject) return (
    <div className={styles.page}>
      <p className={styles.sub}>Materia no encontrada.</p>
      <button className={styles.btnSecondary} onClick={() => navigate('/subjects')}>
        ← Volver
      </button>
    </div>
  );

  // ── Editar materia ────────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      name: subject.name,
      credits: subject.credits,
      passing_grade: subject.passing_grade,
      color: subject.color ?? color,
    });
    setEditError('');
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await updateSubject(id, {
        ...editForm,
        credits:       parseInt(editForm.credits),
        passing_grade: parseFloat(editForm.passing_grade),
      });
      editSubject(id, updated);
      setEditModal(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Eliminar materia ──────────────────────────────────────────────────────────
  const handleDeleteSubject = async () => {
    if (!confirm('¿Eliminar esta materia y todas sus notas?')) return;
    try {
      await deleteSubject(id);
      removeSubject(id);
      navigate('/subjects');
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Añadir nota ───────────────────────────────────────────────────────────────
  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!gradeForm.name)   { setGradeError('El nombre es obligatorio'); return; }
    if (!gradeForm.score)  { setGradeError('La nota es obligatoria'); return; }
    if (!gradeForm.weight) { setGradeError('El peso es obligatorio'); return; }

    const totalWeight = (subject.grades ?? []).reduce((s, g) => s + g.weight, 0);
    if (totalWeight + parseFloat(gradeForm.weight) > 100) {
      setGradeError('El peso total no puede superar 100%');
      return;
    }

    setGradeLoading(true);
    setGradeError('');
    try {
      const created = await createGrade(id, {
        name:   gradeForm.name,
        score:  parseFloat(gradeForm.score),
        weight: parseFloat(gradeForm.weight),
      });
      const newGrades = [...(subject.grades ?? []), created];
      updateSubjectGrades(id, newGrades);
      setGradeForm(EMPTY_GRADE);
      setAddingGrade(false);
    } catch (err) {
      setGradeError(err.message);
    } finally {
      setGradeLoading(false);
    }
  };

  // ── Eliminar nota ─────────────────────────────────────────────────────────────
  const handleDeleteGrade = async (gradeId) => {
    setDeletingGrade(gradeId);
    try {
      await deleteGrade(gradeId);
      updateSubjectGrades(id, (subject.grades ?? []).filter(g => g.id !== gradeId));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingGrade(null);
    }
  };

  // ── Guardar apuntes ───────────────────────────────────────────────────────────
  const handleSaveNotes = async () => {
    setNotesLoading(true);
    try {
      await updateSubjectNotes(id, notes);
      editSubject(id, { notes });
      setEditingNotes(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setNotesLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const { currentAvg, needed, canPass, alreadyPassed, doneWeight, remainWeight } = info;

  return (
    <div className={styles.page}>

      {/* Cabecera */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/subjects')}>
          ← Volver
        </button>
        <div className={styles.detailTitle}>
          <div className={styles.detailDot} style={{ background: color }} />
          <h1 className={styles.title}>{subject.name}</h1>
        </div>
        <p className={styles.sub}>
          {inst?.name} · {subject.credits} créditos · Nota mínima: {subject.passing_grade}
        </p>
        <div className={styles.detailActions}>
          <button className={styles.btnSecondary} onClick={openEdit}>✎ Editar</button>
          <button className={styles.btnDanger} onClick={handleDeleteSubject}>Eliminar</button>
        </div>
      </div>

      {/* Calculadora de aprobado */}
      <div className={styles.neededBox} style={{ borderColor: `${color}40` }}>
        <p className={styles.neededLabel}>¿Cuánto necesito para aprobar?</p>

        {alreadyPassed ? (
          <p className={styles.neededValue} style={{ color: 'var(--green)' }}>
            ¡Ya aprobado! 🎉
          </p>
        ) : needed === null ? (
          <p className={styles.neededValue} style={{ color: 'var(--text-muted)' }}>
            Añade notas para calcular
          </p>
        ) : needed > 10 ? (
          <div>
            <p className={styles.neededValue} style={{ color: 'var(--red)' }}>
              No es posible ☹
            </p>
            <p className={styles.neededSub}>
              Matemáticamente no es posible aprobar con los exámenes restantes
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              className={styles.neededValue}
              style={{ color: needed >= 7 ? 'var(--yellow)' : 'var(--green)' }}
            >
              {needed.toFixed(1)}
            </span>
            <span className={styles.neededSub}>de media en lo que queda</span>
          </div>
        )}

        <div className={styles.neededChips}>
          <span className={styles.chip} style={{ background: `${color}20`, color }}>
            Media actual: {currentAvg.toFixed(2)}
          </span>
          <span className={`${styles.chip} ${styles.chipBlue}`}>
            Evaluado: {doneWeight}%
          </span>
          <span className={`${styles.chip} ${styles.chipYellow}`}>
            Pendiente: {remainWeight}%
          </span>
        </div>
      </div>

      {/* Notas */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Notas registradas</h3>
          <button
            className={styles.btnPrimary}
            onClick={() => { setAddingGrade(true); setGradeError(''); }}
          >
            + Añadir nota
          </button>
        </div>

        {/* Formulario nueva nota */}
        {addingGrade && (
          <form onSubmit={handleAddGrade} className={styles.gradeForm}>
            <input
              className={styles.input}
              placeholder="Nombre (ej: Parcial 2)"
              value={gradeForm.name}
              onChange={e => setGradeForm(p => ({ ...p, name: e.target.value }))}
              autoFocus
            />
            <input
              className={styles.input}
              type="number" min="0" max="10" step="0.1"
              placeholder="Nota"
              value={gradeForm.score}
              onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))}
            />
            <input
              className={styles.input}
              type="number" min="1" max="100"
              placeholder="Peso %"
              value={gradeForm.weight}
              onChange={e => setGradeForm(p => ({ ...p, weight: e.target.value }))}
            />
            <button type="submit" className={styles.btnPrimary} disabled={gradeLoading}>
              {gradeLoading ? <span className={styles.spinner} /> : '✓'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setAddingGrade(false)}
            >
              ✕
            </button>
          </form>
        )}
        {gradeError && <p className={styles.error}>{gradeError}</p>}

        {/* Lista de notas */}
        <div className={styles.gradeList}>
          {(subject.grades ?? []).map(g => (
            <div key={g.id} className={styles.gradeRow}>
              <div
                className={styles.gradeScore}
                style={{
                  background: `${parseFloat(g.score) >= subject.passing_grade ? 'var(--green)' : 'var(--red)'}20`,
                  color: parseFloat(g.score) >= subject.passing_grade ? 'var(--green)' : 'var(--red)',
                }}
              >
                {parseFloat(g.score).toFixed(1)}
              </div>
              <div className={styles.gradeInfo}>
                <span className={styles.gradeName}>{g.name}</span>
                <span className={styles.gradeWeight}>Peso: {g.weight}%</span>
              </div>
              <div className={styles.gradeBar}>
                <div className={styles.progress}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(parseFloat(g.score) / 10) * 100}%`,
                      background: parseFloat(g.score) >= subject.passing_grade ? 'var(--green)' : 'var(--red)',
                    }}
                  />
                </div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteGrade(g.id)}
                disabled={deletingGrade === g.id}
              >
                {deletingGrade === g.id ? '…' : '✕'}
              </button>
            </div>
          ))}

          {/* Notas pendientes */}
          {(subject.pending_grades ?? []).map((g, i) => (
            <div key={`p${i}`} className={`${styles.gradeRow} ${styles.gradeRowPending}`}>
              <div className={styles.gradeScore} style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                ?
              </div>
              <div className={styles.gradeInfo}>
                <span className={styles.gradeName} style={{ color: 'var(--text-muted)' }}>{g.name}</span>
                <span className={styles.gradeWeight}>Peso: {g.weight}% · Pendiente</span>
              </div>
              <span className={`${styles.chip} ${styles.chipYellow}`}>Pendiente</span>
            </div>
          ))}

          {(subject.grades ?? []).length === 0 && (subject.pending_grades ?? []).length === 0 && (
            <p className={styles.emptyText}>Sin notas registradas. Añade tu primera evaluación.</p>
          )}
        </div>
      </div>

      {/* Apuntes */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Apuntes</h3>
          {editingNotes ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={styles.btnPrimary}
                onClick={handleSaveNotes}
                disabled={notesLoading}
              >
                {notesLoading ? <span className={styles.spinner} /> : '✓ Guardar'}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => { setNotes(subject.notes ?? ''); setEditingNotes(false); }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button className={styles.btnSecondary} onClick={() => setEditingNotes(true)}>
              ✎ Editar
            </button>
          )}
        </div>
        {editingNotes ? (
          <textarea
            className={`${styles.input} ${styles.notesInput}`}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Escribe tus apuntes, fórmulas o conceptos clave..."
          />
        ) : (
          <p className={styles.notesText}>
            {subject.notes || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Sin apuntes. Haz clic en Editar para añadir.</span>}
          </p>
        )}
      </div>

      {/* Modal editar materia */}
      {editModal && (
        <div className={styles.overlay} onClick={() => setEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar materia</h2>
              <button className={styles.closeBtn} onClick={() => setEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEdit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre</label>
                <input
                  className={styles.input}
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Créditos</label>
                  <input
                    className={styles.input}
                    type="number" min="1"
                    value={editForm.credits}
                    onChange={e => setEditForm(p => ({ ...p, credits: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nota mínima</label>
                  <input
                    className={styles.input}
                    type="number" min="0" max="10" step="0.1"
                    value={editForm.passing_grade}
                    onChange={e => setEditForm(p => ({ ...p, passing_grade: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Color</label>
                <div className={styles.colorRow}>
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className={`${styles.swatch} ${editForm.color === c ? styles.swatchActive : ''}`}
                      style={{ background: c }}
                      onClick={() => setEditForm(p => ({ ...p, color: c }))}
                    />
                  ))}
                </div>
              </div>
              {editError && <p className={styles.error}>{editError}</p>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={editLoading}>
                  {editLoading ? <span className={styles.spinner} /> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
