// ─── TESTS ────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useApp }   from '../../store/AppContext';
import { generateTest } from '../../api/ai';
import styles from './Tests.module.css';

const STEPS = { SETUP: 'setup', LOADING: 'loading', QUIZ: 'quiz', RESULT: 'result' };

export default function Tests() {
  const { subjects } = useApp();

  const [step,      setStep]      = useState(STEPS.SETUP);
  const [selSub,    setSelSub]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [numQ,      setNumQ]      = useState(5);
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [current,   setCurrent]   = useState(0);
  const [revealed,  setRevealed]  = useState(false);
  const [error,     setError]     = useState('');

  const sub = subjects.find(s => s.id === selSub);

  // Al seleccionar materia, prellenar apuntes
  const handleSubjectChange = (id) => {
    setSelSub(id);
    const s = subjects.find(x => x.id === id);
    if (s?.notes) setNotes(s.notes);
  };

  const generate = async () => {
    const content = notes.trim() || sub?.notes || '';
    if (!content) { setError('Escribe o selecciona contenido para generar el test'); return; }
    setError('');
    setStep(STEPS.LOADING);
    try {
      const data = await generateTest(content, numQ);
      setQuestions(data);
      setAnswers({});
      setCurrent(0);
      setRevealed(false);
      setStep(STEPS.QUIZ);
    } catch (err) {
      setError(err.message || 'Error al generar el test');
      setStep(STEPS.SETUP);
    }
  };

  const selectAnswer = (qi, ai) => {
    if (answers[qi] !== undefined) return;
    setAnswers(p => ({ ...p, [qi]: ai }));
    setRevealed(true);
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
    } else {
      setStep(STEPS.RESULT);
    }
  };

  const reset = () => {
    setStep(STEPS.SETUP);
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setRevealed(false);
    setError('');
  };

  const score = Object.keys(answers).filter(qi => answers[qi] === questions[qi]?.correct).length;
  const pct   = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === STEPS.LOADING) return (
    <div className={styles.centered}>
      <div className={styles.spinner} />
      <h2 className={styles.loadTitle}>Generando tu test con IA</h2>
      <p className={styles.loadSub}>Analizando el contenido y creando preguntas inteligentes…</p>
    </div>
  );

  // ── Resultado ────────────────────────────────────────────────────────────────
  if (step === STEPS.RESULT) return (
    <div className={styles.resultPage}>
      <div className={styles.resultCard}>
        <span className={styles.resultEmoji}>
          {pct >= 80 ? '🎉' : pct >= 60 ? '💪' : '📚'}
        </span>
        <h2 className={styles.resultScore}>{score}/{questions.length} correctas</h2>
        <p className={styles.resultMsg}>
          {pct >= 80 ? '¡Excelente dominio del tema!'
            : pct >= 60 ? 'Buen trabajo, sigue repasando.'
            : 'Necesitas repasar más este contenido.'}
        </p>

        <div className={styles.resultBar}>
          <div
            className={styles.resultFill}
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)',
            }}
          />
        </div>
        <p className={styles.resultPct}
          style={{ color: pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)' }}>
          {pct}%
        </p>

        <div className={styles.resultBtns}>
          <button className={styles.btnPrimary} onClick={() => {
            setStep(STEPS.QUIZ); setCurrent(0); setAnswers({}); setRevealed(false);
          }}>
            🔁 Repetir test
          </button>
          <button className={styles.btnSecondary} onClick={reset}>
            ✦ Nuevo test
          </button>
        </div>
      </div>

      {/* Repaso */}
      <div className={styles.reviewList}>
        <h3 className={styles.reviewTitle}>Repaso de respuestas</h3>
        {questions.map((q, qi) => {
          const isCorrect = answers[qi] === q.correct;
          return (
            <div key={qi} className={`${styles.reviewCard} ${isCorrect ? styles.reviewCorrect : styles.reviewWrong}`}>
              <p className={styles.reviewQ}>{q.question}</p>
              <p className={`${styles.reviewStatus} ${isCorrect ? styles.statusOk : styles.statusFail}`}>
                {isCorrect
                  ? '✓ Correcto'
                  : `✗ Elegiste: ${q.options[answers[qi]]} · Correcto: ${q.options[q.correct]}`}
              </p>
              <p className={styles.reviewExp}>{q.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  if (step === STEPS.QUIZ && questions.length > 0) {
    const q       = questions[current];
    const userAns = answers[current];

    return (
      <div className={styles.quizPage}>

        {/* Progress */}
        <div className={styles.quizHeader}>
          <span className={styles.quizMeta}>{sub?.name ?? 'Test personalizado'}</span>
          <div className={styles.dots}>
            {questions.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i < current ? styles.dotDone : i === current ? styles.dotActive : styles.dotPending}`}
              />
            ))}
          </div>
          <span className={styles.quizCounter}>{current + 1} / {questions.length}</span>
        </div>

        <div className={styles.quizBarWrap}>
          <div className={styles.quizBar} style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className={styles.questionCard}>
          <p className={styles.questionText}>{q.question}</p>

          <div className={styles.options}>
            {q.options.map((opt, ai) => {
              const isSelected = userAns === ai;
              const isCorrect  = ai === q.correct;
              const show       = userAns !== undefined;

              let cls = styles.option;
              if (show && isCorrect)              cls = `${styles.option} ${styles.optionCorrect}`;
              else if (show && isSelected)        cls = `${styles.option} ${styles.optionWrong}`;
              else if (isSelected)                cls = `${styles.option} ${styles.optionSelected}`;

              return (
                <button key={ai} className={cls} onClick={() => selectAnswer(current, ai)}>
                  <span className={styles.optionLetter}>{['A','B','C','D'][ai]}</span>
                  <span className={styles.optionText}>{opt}</span>
                  {show && isCorrect  && <span className={styles.optionIcon}>✓</span>}
                  {show && isSelected && !isCorrect && <span className={styles.optionIcon}>✗</span>}
                </button>
              );
            })}
          </div>

          {revealed && userAns !== undefined && (
            <div className={styles.explanation}>
              <span className={styles.expIcon}>✦</span>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>

        {revealed && (
          <div className={styles.quizFooter}>
            <button className={styles.btnPrimary} onClick={next}>
              {current < questions.length - 1 ? 'Siguiente →' : 'Ver resultados'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.setupPage}>
      <div className={styles.setupHeader}>
        <h1 className={styles.title}>Tests IA</h1>
        <p className={styles.sub}>La IA genera preguntas inteligentes desde tus propios apuntes</p>
      </div>

      <div className={styles.setupCard}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Materia (opcional)</label>
          <select
            className={styles.input}
            value={selSub}
            onChange={e => handleSubjectChange(e.target.value)}
          >
            <option value="">Sin materia — usa el texto de abajo</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Apuntes / Contenido</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Pega aquí tus apuntes, el tema del examen, conceptos clave… La IA generará preguntas basadas en este contenido."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Número de preguntas</label>
          <div className={styles.numBtns}>
            {[3, 5, 8, 10].map(n => (
              <button
                key={n}
                className={`${styles.numBtn} ${numQ === n ? styles.numBtnActive : ''}`}
                onClick={() => setNumQ(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btnGenerate}
          onClick={generate}
          disabled={!notes.trim() && !selSub}
        >
          ✦ Generar test con IA
        </button>
      </div>
    </div>
  );
}
