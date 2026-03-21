// ─── INSTITUTIONS API ─────────────────────────────────────────────────────────
import { api } from './client';

export const getInstitutions = () =>
  api.get('/institutions');

export const createInstitution = (data) =>
  api.post('/institutions', data);
  // data: { name, program, color }

export const updateInstitution = (id, data) =>
  api.patch(`/institutions/${id}`, data);
  // data: { name?, program?, color? }

export const deleteInstitution = (id) =>
  api.delete(`/institutions/${id}`);
