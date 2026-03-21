// ─── GRADES API ───────────────────────────────────────────────────────────────
import { api } from './client';

export const createGrade = (subjectId, data) =>
  api.post(`/subjects/${subjectId}/grades`, data);
  // data: { name, score, weight }

export const updateGrade = (id, data) =>
  api.patch(`/grades/${id}`, data);
  // data: { name?, score?, weight? }

export const deleteGrade = (id) =>
  api.delete(`/grades/${id}`);
