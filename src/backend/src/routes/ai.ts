// ─── AI ROUTES ────────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { env } from '../config/env';

const ai = new Hono();
ai.use('*', authMiddleware);

const SYSTEM_PROMPT_CHAT = `Eres un copiloto académico para estudiantes universitarios llamado Stridy.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Mantente exclusivamente en temas académicos
- Si te preguntan algo fuera del ámbito académico, redirige amablemente al estudio
- NO hagas preguntas al final de tus respuestas
- NO ofrezcas hacer live coding ni escribir código completo por el estudiante
- SÍ puedes dar ejemplos prácticos cortos de código (máximo 10-15 líneas)
- SÍ puedes explicar conceptos, fórmulas, teoremas y métodos de estudio
- SÍ puedes analizar las notas del estudiante y dar consejos concretos
- SÍ puedes crear resúmenes y esquemas de contenido
- Sé directo y conciso, máximo 3-4 párrafos por respuesta
- Usa el contexto académico del estudiante cuando esté disponible`;

const SYSTEM_PROMPT_TEST = `Eres un generador de preguntas de examen para estudiantes universitarios.

REGLAS:
- Genera EXACTAMENTE el número de preguntas solicitado
- Cada pregunta tiene exactamente 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Las preguntas deben cubrir conceptos clave del contenido
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin backticks

FORMATO REQUERIDO (array JSON puro):
[{"question":"...","options":["opción A","opción B","opción C","opción D"],"correct":0,"explanation":"..."}]

El campo "correct" es el índice (0=A, 1=B, 2=C, 3=D).`;

const FREE_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'stepfun/step-3.5-flash:free',
  'arcee-ai/trinity-mini:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'google/gemma-3n-e4b-it:free',
  'minimax/minimax-m2.5:free',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenRouter(messages: any[]) {
  let lastError = '';

  for (let i = 0; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i];

    if (i > 0) await sleep(1000); 

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'Authorization':      `Bearer ${env.OPENROUTER_API_KEY}`,
        'X-OpenRouter-Title': 'Stridy',
      },
      body: JSON.stringify({ model, messages }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    }

    const err = await res.text();
    lastError = err;
    console.warn(`Modelo ${model} falló, probando siguiente...`);
  }

  throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
}

// POST /ai/chat
ai.post('/chat', async (c) => {
  try {
    const { messages, context } = await c.req.json();
    if (!messages?.length) return c.json({ error: 'Mensajes requeridos' }, 400);

    const systemContent = context
      ? `${SYSTEM_PROMPT_CHAT}\n\nCONTEXTO DEL ESTUDIANTE:\n${context}`
      : SYSTEM_PROMPT_CHAT;

    const reply = await callOpenRouter([
      { role: 'system', content: systemContent },
      ...messages,
    ]);

    return c.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return c.json({ error: 'Error al procesar el mensaje' }, 500);
  }
});

// POST /ai/test
ai.post('/test', async (c) => {
  try {
    const { content, num_questions = 5 } = await c.req.json();
    if (!content?.trim()) return c.json({ error: 'Contenido requerido' }, 400);

    const userMessage = `Genera exactamente ${num_questions} preguntas de opción múltiple sobre el siguiente contenido:\n\n${content}`;

    const raw = await callOpenRouter([
      { role: 'system', content: SYSTEM_PROMPT_TEST },
      { role: 'user',   content: userMessage },
    ]);

    // Parsear el JSON de la respuesta
    let questions;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      questions = JSON.parse(cleaned);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) questions = JSON.parse(match[0]);
      else throw new Error('No se pudo parsear la respuesta');
    }

    return c.json(questions);
  } catch (err: any) {
    console.error('AI test error:', err);
    return c.json({ error: 'Error al generar el test' }, 500);
  }
});

export default ai;
