import { apiRequest } from './client.js';

export const food = {
  // Food items (the "template" stored per-entry)
  createItem: (data, token) =>
    apiRequest('/api/food/items', { method: 'POST', body: JSON.stringify(data) }, token),
  updateItem: (id, data, token) =>
    apiRequest(`/api/food/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  // Food logs
  getAllLogs: (token) =>
    apiRequest('/api/food/logs', {}, token),
  getLogsByDate: (date, token) =>
    apiRequest(`/api/food/logs?date=${date}`, {}, token),
  createLog: (data, token) =>
    apiRequest('/api/food/logs', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteLog: (id, token) =>
    apiRequest(`/api/food/logs/${id}`, { method: 'DELETE' }, token),

  // Goals
  getGoals: (token) =>
    apiRequest('/api/food/goals', {}, token),
  updateGoals: (data, token) =>
    apiRequest('/api/food/goals', { method: 'PUT', body: JSON.stringify(data) }, token),

  // Recipes
  getRecipes: (token) =>
    apiRequest('/api/food/recipes', {}, token),
  createRecipe: (data, token) =>
    apiRequest('/api/food/recipes', { method: 'POST', body: JSON.stringify(data) }, token),
  logRecipe: (id, data, token) =>
    apiRequest(`/api/food/recipes/${id}/log`, { method: 'POST', body: JSON.stringify(data) }, token),
  deleteRecipe: (id, token) =>
    apiRequest(`/api/food/recipes/${id}`, { method: 'DELETE' }, token),

  // Weight
  getWeight: (token) =>
    apiRequest('/api/food/weight', {}, token),
  logWeight: (data, token) =>
    apiRequest('/api/food/weight', { method: 'POST', body: JSON.stringify(data) }, token),
};
