import { useState, useEffect } from 'react';
import { todayKey } from '../lib/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { workouts as workoutsApi } from '../api/workouts';

const WORKOUT_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#ef4444', '#f97316',
];

// Backend returns workout_type rows with { id, name, color }
// Frontend cards expect { id, label, color }
function mapCard(row) {
  return { id: row.id, label: row.name, color: row.color };
}

// Backend returns workout log rows with { id, logged_at, workout_type_id, name, color }
// Frontend log expects { [date]: { cardId, label } }
function buildLog(rows) {
  const log = {};
  for (const row of rows) {
    const date = String(row.logged_at).slice(0, 10);
    // Keep one workout per date (first encountered); matches current single-workout-per-day UX
    if (!log[date]) log[date] = { cardId: row.workout_type_id, label: row.name };
  }
  return log;
}

export function useWorkouts() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [log, setLog] = useState({});

  // Load workout types and logs on mount
  useEffect(() => {
    if (!token) { setCards([]); setLog({}); return; }

    workoutsApi.getTypes(token).then(rows => setCards(rows.map(mapCard))).catch(console.error);
    workoutsApi.getLogs(token).then(rows => setLog(buildLog(rows))).catch(console.error);
  }, [token]);

  async function addCard(label) {
    const usedColors = new Set(cards.map(c => c.color));
    const color = WORKOUT_COLORS.find(c => !usedColors.has(c)) ?? WORKOUT_COLORS[cards.length % WORKOUT_COLORS.length];
    const row = await workoutsApi.createType({ name: label, color }, token);
    setCards(prev => [...prev, mapCard(row)]);
  }

  async function deleteCard(id) {
    await workoutsApi.deleteType(id, token);
    setCards(prev => prev.filter(c => c.id !== id));
    // Remove any log entries that referenced this card
    setLog(prev => {
      const next = { ...prev };
      for (const date of Object.keys(next)) {
        if (next[date].cardId === id) delete next[date];
      }
      return next;
    });
  }

  async function applyCard(card) {
    const today = todayKey();
    const current = log[today];

    if (current && current.cardId === card.id) {
      // Toggle off: same card clicked again
      await workoutsApi.toggleLog({ workout_type_id: card.id, logged_at: today }, token);
      setLog(prev => { const { [today]: _, ...rest } = prev; return rest; });
    } else {
      // If a different card is already on for today, toggle it off first
      if (current) {
        await workoutsApi.toggleLog({ workout_type_id: current.cardId, logged_at: today }, token);
      }
      // Toggle on the new card
      await workoutsApi.toggleLog({ workout_type_id: card.id, logged_at: today }, token);
      setLog(prev => ({ ...prev, [today]: { cardId: card.id, label: card.label } }));
    }
  }

  return { cards, log, addCard, deleteCard, applyCard };
}
