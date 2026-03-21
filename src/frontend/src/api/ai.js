// ─── AI API ───────────────────────────────────────────────────────────────────
import { api } from './client';

// Copiloto — envía historial de mensajes y contexto académico del usuario
export const sendCopilotMessage = (messages, context) =>
  api.post('/ai/chat', { messages, context });
  // messages: [{ role: 'user'|'assistant', content: string }]
  // context: string con resumen de materias y notas del usuario

// Generador de tests — recibe contenido y número de preguntas
export const generateTest = (content, numQuestions = 5) =>
  api.post('/ai/test', { content, num_questions: numQuestions });
  // Devuelve: [{ question, options, correct, explanation }]
