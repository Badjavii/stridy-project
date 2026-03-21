// ─── EVENTS API ───────────────────────────────────────────────────────────────
import { api } from './client';

export const getEvents = () =>
  api.get('/events');

export const createEvent = (data) =>
  api.post('/events', data);
  // data: { title, date, type, subject_id? }

export const updateEvent = (id, data) =>
  api.patch(`/events/${id}`, data);
  // data: { title?, date?, type?, subject_id? }

export const deleteEvent = (id) =>
  api.delete(`/events/${id}`);
