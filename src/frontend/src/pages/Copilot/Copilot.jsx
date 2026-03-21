// ─── COPILOT ──────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useApp }  from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { sendCopilotMessage } from '../../api/ai';
import styles from './Copilot.module.css';

const SUGGESTIONS = [
  '¿Cuánto necesito para aprobar todas mis materias?',
  'Dame un plan de estudio para esta semana',
  '¿Qué materia debería priorizar?',
  'Resúmeme mis próximas evaluaciones',
];

function buildContext(subjects, institutions, events) {
  if (!subjects.length) return 'El estudiante no tiene materias registradas aún.';
  return subjects.map(s => {
    const inst    = institutions.find(i => i.id === s.institution_id);
    const grades  = s.grades ?? [];
    const avg     = grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.score * g.weight, 0) / grades.reduce((sum, g) => sum + g.weight, 0)).toFixed(2)
      : 'sin notas';
    return `${s.name} (${inst?.name ?? 'sin institución'}) — media: ${avg}${s.notes ? ` — apuntes: ${s.notes.slice(0, 200)}` : ''}`;
  }).join('\n');
}

export default function Copilot() {
  const { subjects, institutions, events } = useApp();
  const { user }   = useAuth();
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `¡Hola${user ? `, ${user.username}` : ''}! Soy tu copiloto académico ✦\n\nTengo acceso a tus materias, notas y apuntes. Puedo ayudarte a estudiar, calcular qué necesitas para aprobar, crear resúmenes o responder cualquier duda académica. ¿Por dónde empezamos?`,
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));
      const context = buildContext(subjects, institutions, events);
      const data    = await sendCopilotMessage(history, context);
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply ?? data.content ?? data }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor inténtalo de nuevo.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>✦</div>
          <div>
            <h1 className={styles.title}>Copiloto IA</h1>
            <p className={styles.sub}>
              Conectado con {subjects.length} materia{subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          className={styles.clearBtn}
          onClick={() => setMessages([{
            role: 'assistant',
            text: '¡Conversación reiniciada! ¿En qué te puedo ayudar?',
          }])}
        >
          Limpiar chat
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.msgRow} ${m.role === 'user' ? styles.msgRowUser : styles.msgRowAi}`}
          >
            {m.role === 'assistant' && (
              <div className={styles.aiAvatar}>✦</div>
            )}
            <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
              {m.text.split('\n').map((line, li) => (
                <span key={li}>{line}{li < m.text.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className={`${styles.msgRow} ${styles.msgRowAi}`}>
            <div className={styles.aiAvatar}>✦</div>
            <div className={`${styles.bubble} ${styles.bubbleAi} ${styles.typingBubble}`}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sugerencias — solo si es el primer mensaje */}
      {messages.length === 1 && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <button key={s} className={styles.suggestion} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputRow}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="Pregunta algo sobre tus materias…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={styles.sendBtn}
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
