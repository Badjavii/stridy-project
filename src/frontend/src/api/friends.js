// ─── FRIENDS API ──────────────────────────────────────────────────────────────
import { api } from './client';

export const getFriends = () =>
  api.get('/friends');

export const sendFriendRequest = (username) =>
  api.post('/friends/request', { username });

export const acceptFriendRequest = (id) =>
  api.patch(`/friends/${id}/accept`);

export const deleteFriend = (id) =>
  api.delete(`/friends/${id}`);

// Vista social — solo lectura
export const getFriendSubjects  = (id) => api.get(`/friends/${id}/subjects`);
export const getFriendEvents    = (id) => api.get(`/friends/${id}/events`);
export const getFriendSchedule  = (id) => api.get(`/friends/${id}/schedule`);
