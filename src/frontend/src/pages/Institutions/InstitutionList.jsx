// ─── INSTITUTION LIST ─────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  createInstitution,
  updateInstitution,
  deleteInstitution,
} from '../../api/institutions';
import styles from './Institutions.module.css';

const COLORS = [
  '#7c6ef5', '#4da6ff', '#34c97a',
  '#f0b429', '#e8534e', '#f472b6', '#fb923c',
];

const EMPTY_FORM = { name: '', program: '', color: COLORS[0] };

export default function InstitutionList() {
  const { institutions, subjects, addInstitution, editInstitution, removeInstitution } = useApp();
  const navigate = useNavigate();

  const [modal, setModal]     = useState(false);   // abrir/cerrar modal
  const [editing, setEditing] = useState(null);    // inst que se edita (null = crear)
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [deleting, setDeleting] = useState(null);  // id que se está borrando

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  };

  const openEdit = (inst) => {
    setEditing(inst);
    setForm({ name: inst.name, program: inst.program, color: inst.color });
    setError('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      if (editing) {
        const updated = await updateInstitution(editing.id, form);
        editInstitution(editing.id, updated);
      } else {
        const created = await createInstitution(form);
        addInstitution(created);
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta institución y todas sus materias?')) return;
    setDeleting(id);
    try {
      await deleteInstitution(id);
      removeInstitution(id);
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
          <h1 className={styles.title}>Instituciones</h1>
          <p className={styles.sub}>Gestiona tus universidades, institutos y programas</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Nueva institución
        </button>
      </div>

      {/* Grid */}
      {institutions.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎓</span>
          <h3>Sin instituciones aún</h3>
          <p>Añade tu primera universidad o programa académico</p>
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Nueva institución
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {institutions.map(inst => {
            const instSubjects = subjects.filter(s => s.institution_id === inst.id);
            return (
              <div key={inst.id} className={styles.card}>
                <div className={styles.cardBar} style={{ background: inst.color }} />
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon} style={{ background: `${inst.color}20` }}>
                    🎓
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.iconBtn} onClick={() => openEdit(inst)} title="Editar">
                      ✎
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(inst.id)}
                      disabled={deleting === inst.id}
                      title="Eliminar"
                    >
                      {deleting === inst.id ? '…' : '✕'}
                    </button>
                  </div>
                </div>
                <h3 className={styles.cardName}>{inst.name}</h3>
                <p className={styles.cardProg}>{inst.program}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardCount}>{instSubjects.length} materias</span>
                  <button
                    className={styles.cardLink}
                    onClick={() => navigate(`/subjects?institution_id=${inst.id}`)}
                  >
                    Ver materias →
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card añadir */}
          <div className={styles.cardAdd} onClick={openCreate}>
            <span className={styles.cardAddIcon}>+</span>
            <span className={styles.cardAddLabel}>Nueva institución</span>
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Editar institución' : 'Nueva institución'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre *</label>
                <input
                  className={styles.input}
                  placeholder="Ej: Universidad Central de Venezuela"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Carrera / Programa</label>
                <input
                  className={styles.input}
                  placeholder="Ej: Licenciatura en Física"
                  value={form.program}
                  onChange={e => setForm(p => ({ ...p, program: e.target.value }))}
                />
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
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading
                    ? <span className={styles.spinner} />
                    : editing ? 'Guardar cambios' : 'Crear institución'
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
