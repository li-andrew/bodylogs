import { apiRequest } from './client.js';

export const workouts = {
  // Workout types (cards)
  getTypes: (token) =>
    apiRequest('/api/workout/types', {}, token),
  createType: (data, token) =>
    apiRequest('/api/workout/types', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteType: (id, token) =>
    apiRequest(`/api/workout/types/${id}`, { method: 'DELETE' }, token),

  // Workout logs
  getLogs: (token) =>
    apiRequest('/api/workout/logs', {}, token),
  toggleLog: (data, token) =>
    apiRequest('/api/workout/logs', { method: 'POST', body: JSON.stringify(data) }, token),
};
