import { useState, useEffect } from 'react';
import { todayKey } from '../lib/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { food as foodApi } from '../api/food';

export function useWeight() {
  const { token } = useAuth();
  const [weightLog, setWeightLog] = useState({});

  // Load all weight entries on mount
  useEffect(() => {
    if (!token) { setWeightLog({}); return; }

    foodApi.getWeight(token).then(rows => {
      const mapped = {};
      for (const row of rows) {
        const date = String(row.logged_at).slice(0, 10);
        mapped[date] = Number(row.weight);
      }
      setWeightLog(mapped);
    }).catch(console.error);
  }, [token]);

  async function logWeight(val) {
    const today = todayKey();
    await foodApi.logWeight({ weight: val, logged_at: today }, token);
    setWeightLog(prev => ({ ...prev, [today]: val }));
  }

  return { weightLog, logWeight };
}
