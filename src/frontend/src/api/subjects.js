// ─── SUBJECTS API ─────────────────────────────────────────────────────────────
import { api } from './client';

export const getSubjects = (institutionId = null) => {
  const query = institutionId ? `?institution_id=${institutionId}` : '';
  return api.get(`/subjects${query}`);
};

export const createSubject = (data) =>
  api.post('/subjects', data);
  // data: { institution_id, name, color, credits, passing_grade }

export const updateSubject = (id, data) =>
  api.patch(`/subjects/${id}`, data);
  // data: { name?, color?, credits?, passing_grade? }

export const updateSubjectNotes = (id, notes) =>
  api.patch(`/subjects/${id}/notes`, { notes });

export const deleteSubject = (id) =>
  api.delete(`/subjects/${id}`);
