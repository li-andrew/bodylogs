import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MACROS } from '../../data/macros';
import { getDailyData } from '../../lib/logUtils';
import LineChart from '../../components/LineChart/LineChart';
import WeightSection from '../../components/WeightSection/WeightSection';
import MacroPieChart from '../../components/MacroPieChart/MacroPieChart';
import WorkoutCalendar from '../../components/WorkoutCalendar/WorkoutCalendar';
import styles from './Metrics.module.css';

const AVG_RULES = {
  cal:     { type: 'within', tol: 100 },
  protein: { type: 'within', tol: 10  },
  carbs:   { type: 'within', tol: 25  },
  fat:     { type: 'over',   by: 5    },
  sodium:  { type: 'over',   by: 200  },
  sugar:   { type: 'over',   by: 5    },
};

function avgColor(avg, goal, rule) {
  if (avg === null || goal == null) return undefined;
  if (rule.type === 'within') return Math.abs(avg - goal) <= rule.tol ? '#22c55e' : '#ef4444';
  if (rule.type === 'over')   return avg > goal + rule.by             ? '#ef4444' : '#22c55e';
}

export default function Metrics() {
  const { logs, goals, goalWeight } = useOutletContext();
  const [syncDate, setSyncDate] = useState(null);

  return (
    <div>
      <h2 className={styles.heading}>Metrics</h2>
      <p className={styles.sub}>Track your trends over time.</p>

      <WeightSection syncDate={syncDate} onHoverDate={setSyncDate} goalWeight={goalWeight} />

      <div className={styles.grid}>
        {MACROS.map(({ key, label, unit, color }) => {
          const rule = AVG_RULES[key];
          const data = getDailyData(logs, key);
          const avgNum = data.length > 0
            ? data.reduce((sum, d) => sum + d.total, 0) / data.length
            : null;
          const avg = avgNum !== null ? avgNum.toFixed(1) : null;
          const goal = goals?.[key];
          const color2 = avgColor(avgNum, goal, rule);
          const diff = avgNum !== null && goal != null ? avgNum - goal : null;
          const diffStr = diff !== null
            ? ` (${diff > 0 ? '+' : ''}${Math.round(diff)}${unit})`
            : '';
          return (
            <div key={key} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{label}</span>
                <span className={styles.cardAvg} style={{ color: color2 }}>
                  {avg !== null ? `avg ${avg}${unit}${diffStr}` : ''}
                </span>
                <span className={styles.cardUnit} style={{ color }}>{unit}</span>
              </div>
              <LineChart data={data} color={color} unit={unit} syncDate={syncDate} onHoverDate={setSyncDate} goalLine={goal} avgLine={avgNum} />
            </div>
          );
        })}
      </div>

      <MacroPieChart logs={logs} />

      <WorkoutCalendar />
    </div>
  );
}
