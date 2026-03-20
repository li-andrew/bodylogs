import { useState } from 'react';
import { DEFAULT_GOALS } from '../data/defaultGoals';
import { MACRO_KEYS } from '../data/macros';
import { todayKey, shiftDate } from '../lib/dateUtils';

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
    (acc, e) => {
      const next = {};
      MACRO_KEYS.forEach(k => { next[k] = acc[k] + (e[k] ?? 0); });
      return next;
    },
    Object.fromEntries(MACRO_KEYS.map(k => [k, 0])),
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
