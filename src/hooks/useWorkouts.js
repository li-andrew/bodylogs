import { useState } from 'react';
import { todayKey } from '../lib/dateUtils';

const WORKOUT_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#ef4444', '#f97316',
];

function loadWorkoutCards() {
  try { return JSON.parse(localStorage.getItem('workout_cards') || '[]'); } catch { return []; }
}
function loadWorkoutLog() {
  try { return JSON.parse(localStorage.getItem('workout_log') || '{}'); } catch { return {}; }
}

export function useWorkouts() {
  const [cards, setCards] = useState(loadWorkoutCards);
  const [log, setLog] = useState(loadWorkoutLog);

  function saveCards(updated) {
    setCards(updated);
    localStorage.setItem('workout_cards', JSON.stringify(updated));
  }
  function saveLog(updated) {
    setLog(updated);
    localStorage.setItem('workout_log', JSON.stringify(updated));
  }

  function addCard(label) {
    const usedColors = new Set(cards.map(c => c.color));
    const color = WORKOUT_COLORS.find(c => !usedColors.has(c)) ?? WORKOUT_COLORS[cards.length % WORKOUT_COLORS.length];
    saveCards([...cards, { id: Date.now(), label, color }]);
  }

  function deleteCard(id) {
    saveCards(cards.filter(c => c.id !== id));
  }

  function applyCard(card) {
    const today = todayKey();
    const current = log[today];
    if (current && current.cardId === card.id) {
      const { [today]: _, ...rest } = log;
      saveLog(rest);
    } else {
      saveLog({ ...log, [today]: { cardId: card.id, label: card.label } });
    }
  }

  return { cards, log, addCard, deleteCard, applyCard };
}
