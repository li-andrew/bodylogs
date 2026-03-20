import { useState } from 'react';
import { useWeight } from '../../hooks/useWeight';
import { todayKey } from '../../lib/dateUtils';
import LineChart from '../LineChart/LineChart';
import styles from './WeightSection.module.css';

export default function WeightSection({ syncDate, onHoverDate }) {
  const { weightLog, goalWeight, logWeight } = useWeight();
  const [input, setInput] = useState('');

  const today = todayKey();
  const todayWeight = weightLog[today];

  const sortedDates = Object.keys(weightLog).sort();
  const firstDate = sortedDates[0];
  const firstWeight = firstDate ? weightLog[firstDate] : null;
  const hasHistory = firstWeight != null && todayWeight != null && firstDate !== today;
  const totalChange = hasHistory ? todayWeight - firstWeight : null;
  const weeksBetween = hasHistory
    ? (new Date(today) - new Date(firstDate)) / (1000 * 60 * 60 * 24 * 7)
    : null;
  const weeklyRate = hasHistory
    ? weeksBetween >= 1
      ? (firstWeight - todayWeight) / weeksBetween
      : firstWeight - todayWeight
    : null;

  const tryingToLose = goalWeight != null && goalWeight < todayWeight;
  const tryingToGain = goalWeight != null && goalWeight > todayWeight;
  const totalChangeColor = hasHistory && (tryingToLose || tryingToGain)
    ? (tryingToLose ? totalChange < 0 : totalChange > 0) ? '#22c55e' : '#ef4444'
    : undefined;
  const weeklyColor = weeklyRate != null && (tryingToLose || tryingToGain)
    ? (tryingToLose ? weeklyRate > 0 : weeklyRate < 0) ? '#22c55e' : '#ef4444'
    : undefined;

  function handleLog() {
    const val = parseFloat(input);
    if (isNaN(val) || val <= 0) return;
    logWeight(val);
    setInput('');
  }

  const weightData = Object.keys(weightLog).sort().map(date => ({
    date,
    total: weightLog[date],
  }));

  return (
    <div className={styles.weightSection}>
      <div className={styles.weightCard}>
        <div className={styles.weightHeader}>
          <div>
            <span className={styles.cardTitle}>Weight</span>
            {hasHistory && (
              <span className={styles.todayWeight}>
                {' — '}
                <span style={{ color: totalChangeColor }}>{totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} lbs</span>
                {weeklyRate != null
                  ? <> · <span style={{ color: weeklyColor }}>{weeklyRate >= 0 ? '-' : '+'}{Math.abs(weeklyRate).toFixed(2)} lbs/wk</span></>
                  : null
                }
              </span>
            )}
          </div>
          <div className={styles.weightInput}>
            {goalWeight && (
              <span className={styles.goalLabel}>Goal: {goalWeight} lbs</span>
            )}
            <span className={styles.todayLabel}>Today's weight: </span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder={todayWeight ? `${todayWeight} lbs` : 'lbs'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLog()}
              className={styles.weightField}
            />
            <button onClick={handleLog} className={styles.weightBtn}>
              {todayWeight ? 'Update' : 'Log'}
            </button>
          </div>
        </div>
        <LineChart data={weightData} color="var(--accent)" unit=" lbs" startFromZero={false} yMin={100} scale={0.35} H={50} syncDate={syncDate} onHoverDate={onHoverDate} goalLine={goalWeight} />
      </div>
    </div>
  );
}
