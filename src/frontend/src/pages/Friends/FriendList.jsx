// ─── FRIEND LIST ──────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp }  from '../../store/AppContext';
import {
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
} from '../../api/friends';
import styles from './Friends.module.css';

export default function FriendList() {
  const { friends, addFriend, removeFriend } = useApp();
  const navigate = useNavigate();

  const [modal,   setModal]   = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [accepting, setAccepting] = useState(null);

  const accepted = friends.filter(f => f.status === 'accepted');
  const pending  = friends.filter(f => f.status === 'pending');

  const handleRequest = async (e) => {
    e.preventDefault();
    const clean = username.trim().startsWith('@')
      ? username.trim()
      : `@${username.trim()}`;
    if (!clean || clean === '@') { setError('Escribe un username válido'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await sendFriendRequest(clean);
      addFriend(data);
      setSuccess(`Solicitud enviada a ${clean}`);
      setUsername('');
      setTimeout(() => { setModal(false); setSuccess(''); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      const updated = await acceptFriendRequest(id);
      // Actualizar estado local del amigo
      addFriend({ ...updated, status: 'accepted' });
    } catch (err) {
      alert(err.message);
    } finally {
      setAccepting(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este amigo?')) return;
    setDeleting(id);
    try {
      await deleteFriend(id);
      removeFriend(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const initials = (username) =>
    username?.replace('@', '').slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Amigos</h1>
          <p className={styles.sub}>
            {accepted.length} amigo{accepted.length !== 1 ? 's' : ''}
            {pending.length > 0 && ` · ${pending.length} solicitud${pending.length !== 1 ? 'es' : ''} pendiente${pending.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setModal(true); setError(''); setSuccess(''); }}>
          + Añadir amigo
        </button>
      </div>

      {/* Solicitudes pendientes */}
      {pending.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Solicitudes pendientes</h2>
          <div className={styles.list}>
            {pending.map(f => (
              <div key={f.id} className={styles.friendCard}>
                <div className={styles.friendAvatar} style={{ background: 'var(--yellow-soft)', color: 'var(--yellow)' }}>
                  {initials(f.username)}
                </div>
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{f.username}</span>
                  <span className={styles.friendMeta}>Solicitud pendiente</span>
                </div>
                <div className={styles.friendActions}>
                  {f.received ? (
                    <>
                      <button
                        className={styles.btnAccept}
                        onClick={() => handleAccept(f.id)}
                        disabled={accepting === f.id}
                      >
                        {accepting === f.id ? '…' : '✓ Aceptar'}
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                      >
                        {deleting === f.id ? '…' : 'Rechazar'}
                      </button>
                    </>
                  ) : (
                    <span className={styles.chipPending}>Enviada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Amigos aceptados */}
      <section className={styles.section}>
        {accepted.length === 0 && pending.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>👥</span>
            <h3>Sin amigos aún</h3>
            <p>Añade amigos por su username para compartir calendarios y horarios</p>
            <button className={styles.btnPrimary} onClick={() => setModal(true)}>
              + Añadir amigo
            </button>
          </div>
        ) : accepted.length > 0 ? (
          <>
            <h2 className={styles.sectionTitle}>Mis amigos</h2>
            <div className={styles.list}>
              {accepted.map(f => (
                <div
                  key={f.id}
                  className={styles.friendCard}
                  onClick={() => navigate(`/friends/${f.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.friendAvatarWrap}>
                    <div className={styles.friendAvatar}>
                      {initials(f.username)}
                    </div>
                    <span
                      className={styles.onlineDot}
                      style={{ background: f.online ? 'var(--green)' : 'var(--border-2)' }}
                    />
                  </div>
                  <div className={styles.friendInfo}>
                    <span className={styles.friendName}>{f.username}</span>
                    <span className={styles.friendMeta}>
                      {f.online ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                  <div className={styles.friendActions} onClick={e => e.stopPropagation()}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/friends/${f.id}`)}
                    >
                      Ver perfil →
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(f.id)}
                      disabled={deleting === f.id}
                    >
                      {deleting === f.id ? '…' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* Modal añadir amigo */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Añadir amigo</h2>
              <button className={styles.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={handleRequest} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input
                  className={styles.input}
                  placeholder="@username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div className={styles.infoBox}>
                <p>Escribe el username exacto de tu amigo. Recibirá una solicitud que debe aceptar.</p>
              </div>

              {error   && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.successMsg}>✓ {success}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
