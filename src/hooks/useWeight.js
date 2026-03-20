import { useState } from 'react';
import { todayKey } from '../lib/dateUtils';

function loadWeightLog() {
  const all = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('weight_') && key !== 'weight_goal') {
      const val = parseFloat(localStorage.getItem(key));
      if (!isNaN(val)) all[key.slice(7)] = val;
    }
  }
  return all;
}

export function useWeight() {
  const [weightLog, setWeightLog] = useState(loadWeightLog);
  const [goalWeight] = useState(() => {
    const val = parseFloat(localStorage.getItem('weight_goal'));
    return isNaN(val) ? null : val;
  });

  function logWeight(val) {
    const today = todayKey();
    localStorage.setItem('weight_' + today, String(val));
    setWeightLog(prev => ({ ...prev, [today]: val }));
  }

  return { weightLog, goalWeight, logWeight };
}
