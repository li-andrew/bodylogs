import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import styles from './Metrics.module.css';

const METRICS = [
  { key: 'cal',     label: 'Calories', unit: 'kcal', color: 'var(--cal)'     },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--protein)' },
  { key: 'carbs',   label: 'Carbs',    unit: 'g',    color: 'var(--carbs)'   },
  { key: 'fat',     label: 'Fat',      unit: 'g',    color: 'var(--fat)'     },
  { key: 'sodium',  label: 'Sodium',   unit: 'mg',   color: 'var(--sodium)'  },
  { key: 'sugar',   label: 'Sugar',    unit: 'g',    color: 'var(--sugar)'   },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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

function getDailyData(logs, key) {
  const dates = Object.keys(logs).sort();
  return dates.map(date => {
    const entries = logs[date] || [];
    const total = entries.reduce((sum, e) => sum + (e[key] ?? 0), 0);
    return { date, total };
  });
}

function formatDateShort(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function LineChart({ data, color, unit, startFromZero = true, scale = 1, H = 160, syncDate = null, onHoverDate, goalLine = null }) {
  const [hovered, setHovered] = useState(null);
  const s = scale;
  const W = 400;
  const padL = 25 * s;
  const padR = 12 * s;
  const padT = 12 * s;
  const padB = 28 * s;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const labelSize = 9 * s;
  const strokeW = 1.5 * s;
  const dotR = 4 * s;
  const dotRHov = 5 * s;
  const dotHit = 10 * s;

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📈</span>
        <p>No data yet</p>
      </div>
    );
  }

  const totals = data.map(d => d.total);
  const maxVal = Math.max(...totals, goalLine ?? 1, 1);
  const minVal = startFromZero ? 0 : Math.max(0, Math.min(...totals) - (maxVal - Math.min(...totals)) * 0.2);

  const toX = (i) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const toY = (v) => padT + innerH - ((v - minVal) / (maxVal - minVal || 1)) * innerH;

  const points = data.map((d, i) => [toX(i), toY(d.total)]);
  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');

  // Y axis ticks
  const yTicks = startFromZero
    ? [0, Math.round(maxVal / 2), Math.round(maxVal)]
    : [Math.round(minVal), Math.round(minVal + (maxVal - minVal) * 0.5), Math.round(maxVal)];

  // X axis labels: show at most 7, spaced evenly
  const xIndices = data.length <= 7
    ? data.map((_, i) => i)
    : [0, ...Array.from({ length: 5 }, (_, i) => Math.round((i + 1) * (data.length - 1) / 6)), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-label="line chart">
      {/* Grid lines */}
      {yTicks.map(t => (
        <line key={t} x1={padL} x2={padL + innerW} y1={toY(t)} y2={toY(t)}
          stroke="var(--border)" strokeWidth={s} opacity="0.7" />
      ))}

      {/* Y axis ticks */}
      {yTicks.map(t => (
        <text key={t} x={padL - 6*s} y={toY(t)} textAnchor="end" dominantBaseline="middle"
          fill="var(--muted)" fontSize={labelSize} fontFamily="inherit">
          {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
        </text>
      ))}

      {/* Vertical crosshair */}
      {(() => {
        const crosshairI = hovered !== null
          ? hovered
          : syncDate ? data.findIndex(d => d.date === syncDate) : -1;
        if (crosshairI < 0) return null;
        return (
          <line x1={points[crosshairI][0]} x2={points[crosshairI][0]}
            y1={padT} y2={padT + innerH}
            stroke="var(--muted)" strokeWidth={s} strokeDasharray={`${3*s} ${3*s}`} pointerEvents="none" />
        );
      })()}

      {/* Goal line */}
      {goalLine != null && toY(goalLine) >= padT && toY(goalLine) <= padT + innerH && (
        <line x1={padL} x2={padL + innerW} y1={toY(goalLine)} y2={toY(goalLine)}
          stroke={color} strokeWidth={s} strokeDasharray={`${4*s} ${3*s}`} opacity="0.5" pointerEvents="none" />
      )}

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color}
        strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />

      {/* X axis labels */}
      {xIndices.map(i => (
        <text key={i} x={toX(i)} y={H - 6*s} textAnchor="middle"
          fill="var(--muted)" fontSize={labelSize} fontFamily="inherit">
          {formatDateShort(data[i].date)}
        </text>
      ))}

      {/* Axes */}
      <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="var(--border)" strokeWidth={s} />
      <line x1={padL} x2={padL + innerW} y1={padT + innerH} y2={padT + innerH} stroke="var(--border)" strokeWidth={s} />

      {/* Dots */}
      {points.map(([x, y], i) => (
        <g key={i}
          onMouseEnter={() => { setHovered(i); onHoverDate?.(data[i].date); }}
          onMouseLeave={() => { setHovered(null); onHoverDate?.(null); }}
        >
          <circle cx={x} cy={y} r={dotHit} fill="transparent" />
          <circle cx={x} cy={y} r={hovered === i ? dotRHov : dotR} fill={color} stroke="var(--surface)" strokeWidth={2*s} />
        </g>
      ))}

      {/* Hover tooltip — rendered last so it's always on top */}
      {hovered !== null && (() => {
        const [x, y] = points[hovered];
        const label = `${Math.round(data[hovered].total)}${unit}`;
        const boxW = Math.max(label.length * 6.5 * s, 40 * s);
        const boxH = 18 * s;
        const boxY = y - 30 * s;
        return (
          <g pointerEvents="none">
            <rect x={x - boxW / 2} y={boxY} width={boxW} height={boxH} rx={4*s} fill="var(--text)" opacity="0.85" />
            <text x={x} y={boxY + boxH / 2 } textAnchor="middle" dominantBaseline="middle"
              fill="var(--surface)" fontSize={7*s} fontFamily="inherit" fontWeight="600">
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function WeightSection({ syncDate, onHoverDate }) {
  const [weightLog, setWeightLog] = useState(loadWeightLog);
  const [input, setInput] = useState('');
  const [goalWeight] = useState(() => {
    const val = parseFloat(localStorage.getItem('weight_goal'));
    return isNaN(val) ? null : val;
  });

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

  function handleLog() {
    const val = parseFloat(input);
    if (isNaN(val) || val <= 0) return;
    localStorage.setItem('weight_' + today, String(val));
    setWeightLog(prev => ({ ...prev, [today]: val }));
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
                {' — '}{totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} lbs
                {weeklyRate != null
                  ? <> · {weeklyRate >= 0 ? '-' : '+'}{Math.abs(weeklyRate).toFixed(2)} lbs/wk</>
                  : null
                }
              </span>
            )}
          </div>
          <div className={styles.weightInput}>
            {goalWeight && (
              <span className={styles.todayLabel}>Goal: {goalWeight} lbs</span>
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
        <LineChart data={weightData} color="var(--accent)" unit=" lbs" startFromZero={true} scale={0.35} H={50} syncDate={syncDate} onHoverDate={onHoverDate} goalLine={goalWeight} />
      </div>
    </div>
  );
}

export default function Metrics() {
  const { logs } = useOutletContext();
  const [syncDate, setSyncDate] = useState(null);

  return (
    <div>
      <h2 className={styles.heading}>Metrics</h2>
      <p className={styles.sub}>Track your trends over time.</p>

      <WeightSection syncDate={syncDate} onHoverDate={setSyncDate} />

      <div className={styles.grid}>
        {METRICS.map(({ key, label, unit, color }) => {
          const data = getDailyData(logs, key);
          return (
            <div key={key} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{label}</span>
                <span className={styles.cardUnit} style={{ color }}>{unit}</span>
              </div>
              <LineChart data={data} color={color} unit={unit} syncDate={syncDate} onHoverDate={setSyncDate} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
