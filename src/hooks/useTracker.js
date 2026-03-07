import { useState } from 'react';
import { DEFAULT_GOALS } from '../data/defaultGoals';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(key, days) {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadAllLogs() {
  const all = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('log_')) {
      try { all[key.slice(4)] = JSON.parse(localStorage.getItem(key)); } catch { /* skip */ }
    }
  }
  return all;
}

function loadGoals() {
  try {
    const raw = localStorage.getItem('goals');
    // Merge with DEFAULT_GOALS so any newly added fields always have a value
    return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : DEFAULT_GOALS;
  } catch { return DEFAULT_GOALS; }
}

export function useTracker() {
  const [currentDate, setCurrentDate] = useState(todayKey);
  const [goals, setGoals] = useState(loadGoals);
  const [logs, setLogs] = useState(loadAllLogs);

  const currentLog = logs[currentDate] ?? [];

  function persistLog(date, entries) {
    setLogs(prev => ({ ...prev, [date]: entries }));
    localStorage.setItem('log_' + date, JSON.stringify(entries));
  }

  function addEntry(entry) {
    persistLog(currentDate, [...currentLog, { ...entry, id: Date.now() }]);
  }

  function addEntries(newEntries) {
    const stamped = newEntries.map((e, i) => ({ ...e, id: Date.now() + i }));
    persistLog(currentDate, [...currentLog, ...stamped]);
  }

  function deleteEntry(id) {
    persistLog(currentDate, currentLog.filter(e => e.id !== id));
  }

  function updateEntry(id, fields) {
    persistLog(currentDate, currentLog.map(e => e.id === id ? { ...e, ...fields } : e));
  }

  function updateGoals(newGoals) {
    setGoals(newGoals);
    localStorage.setItem('goals', JSON.stringify(newGoals));
  }

  const totals = currentLog.reduce(
    (acc, e) => ({
      cal:     acc.cal     + e.cal,
      protein: acc.protein + e.protein,
      carbs:   acc.carbs   + e.carbs,
      fat:     acc.fat     + e.fat,
      sodium:  acc.sodium  + (e.sodium  ?? 0),
      sugar:   acc.sugar   + (e.sugar   ?? 0),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0 },
  );

  return {
    currentDate,
    currentLog,
    logs,
    goals,
    totals,
    addEntry,
    addEntries,
    deleteEntry,
    updateEntry,
    updateGoals,
    prevDay: () => setCurrentDate(d => shiftDate(d, -1)),
    nextDay: () => setCurrentDate(d => shiftDate(d, 1)),
  };
}
