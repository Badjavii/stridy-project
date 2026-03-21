// ─── SCHEDULE API ─────────────────────────────────────────────────────────────
import { api } from './client';

export const getSchedule = () =>
  api.get('/schedule');

export const createSlot = (data) =>
  api.post('/schedule', data);
  // data: { subject_id, day_of_week, start_time, end_time }

export const updateSlot = (id, data) =>
  api.patch(`/schedule/${id}`, data);
  // data: { day_of_week?, start_time?, end_time? }

export const deleteSlot = (id) =>
  api.delete(`/schedule/${id}`);
