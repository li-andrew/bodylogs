import { apiRequest } from '../api/client.js';

function getToken() {
  return localStorage.getItem('token');
}

export async function parseFoodEntry(text) {
  return apiRequest('/api/ai/parse', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, getToken());
}

export async function updateFoodEntry(entry, instruction) {
  return apiRequest('/api/ai/update', {
    method: 'POST',
    body: JSON.stringify({ entry, instruction }),
  }, getToken());
}
