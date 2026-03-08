import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import styles from './Metrics.module.css';

// AVG COLOR RULES
// type 'within': green if |avg - goal| <= tol, else red
// type 'over':   green if avg <= goal + by,    else red
const METRICS = [
  { key: 'cal',     label: 'Calories', unit: 'kcal', color: 'var(--cal)',     avgRule: { type: 'within', tol: 100 } },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--protein)', avgRule: { type: 'within', tol: 10  } },
  { key: 'carbs',   label: 'Carbs',    unit: 'g',    color: 'var(--carbs)',   avgRule: { type: 'within', tol: 25  } },
  { key: 'fat',     label: 'Fat',      unit: 'g',    color: 'var(--fat)',     avgRule: { type: 'over',   by: 5    } },
  { key: 'sodium',  label: 'Sodium',   unit: 'mg',   color: 'var(--sodium)',  avgRule: { type: 'over',   by: 200  } },
  { key: 'sugar',   label: 'Sugar',    unit: 'g',    color: 'var(--sugar)',   avgRule: { type: 'over',   by: 5    } },
];

function avgColor(avg, goal, rule) {
  if (avg === null || goal == null) return undefined;
  if (rule.type === 'within') return Math.abs(avg - goal) <= rule.tol ? '#22c55e' : '#ef4444';
  if (rule.type === 'over')   return avg > goal + rule.by             ? '#ef4444' : '#22c55e';
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function LineChart({ data, color, unit, startFromZero = true, scale = 1, H = 160, syncDate = null, onHoverDate, goalLine = null, avgLine = null, yMin = null }) {
  const [hovered, setHovered] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null); // 'goal' | 'avg' | null
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
  const minVal = yMin !== null ? yMin : startFromZero ? 0 : Math.max(0, Math.min(...totals) - (maxVal - Math.min(...totals)) * 0.2);

  const toX = (i) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const toY = (v) => padT + innerH - ((v - minVal) / (maxVal - minVal || 1)) * innerH;

  const points = data.map((d, i) => [toX(i), toY(d.total)]);
  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');

  function fmtTick(v) {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return parseFloat(v.toFixed(1));
  }

  // Y axis ticks
  const yTicks = startFromZero
    ? [0, maxVal / 2, maxVal]
    : [minVal, minVal + (maxVal - minVal) * 0.5, maxVal];

  // X axis labels: show at most 7, spaced evenly
  const xIndices = data.length <= 7
    ? data.map((_, i) => i)
    : [0, ...Array.from({ length: 5 }, (_, i) => Math.round((i + 1) * (data.length - 1) / 6)), data.length - 1];

  function handleSvgMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-label="line chart" onMouseMove={handleSvgMouseMove}>
      {/* Grid lines */}
      {yTicks.map(t => (
        <line key={t} x1={padL} x2={padL + innerW} y1={toY(t)} y2={toY(t)}
          stroke="var(--border)" strokeWidth={s} opacity="0.7" />
      ))}

      {/* Y axis ticks */}
      {yTicks.map(t => (
        <text key={t} x={padL - 6*s} y={toY(t)} textAnchor="end" dominantBaseline="middle"
          fill="var(--muted)" fontSize={labelSize} fontFamily="inherit">
          {fmtTick(t)}
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
        <g onMouseEnter={() => setHoveredLine('goal')} onMouseLeave={() => setHoveredLine(null)}>
          <line x1={padL} x2={padL + innerW} y1={toY(goalLine)} y2={toY(goalLine)}
            stroke="transparent" strokeWidth={8*s} />
          <line x1={padL} x2={padL + innerW} y1={toY(goalLine)} y2={toY(goalLine)}
            stroke={color} strokeWidth={s} opacity="0.5" pointerEvents="none" />
        </g>
      )}

      {/* Average line */}
      {avgLine != null && toY(avgLine) >= padT && toY(avgLine) <= padT + innerH && (
        <g onMouseEnter={() => setHoveredLine('avg')} onMouseLeave={() => setHoveredLine(null)}>
          <line x1={padL} x2={padL + innerW} y1={toY(avgLine)} y2={toY(avgLine)}
            stroke="transparent" strokeWidth={8*s} />
          <line x1={padL} x2={padL + innerW} y1={toY(avgLine)} y2={toY(avgLine)}
            stroke={color} strokeWidth={s} strokeDasharray={`${4*s} ${3*s}`} opacity="0.35" pointerEvents="none" />
        </g>
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
        const label = `${parseFloat(data[hovered].total.toFixed(1))}${unit}`;
        const boxW = Math.max(label.length * 6.5 * s, 40 * s);
        const boxH = 18 * s;
        const boxY = y - 30 * s;
        return (
          <g pointerEvents="none">
            <rect x={x - boxW / 2} y={boxY} width={boxW} height={boxH} rx={4*s} fill="var(--text)" opacity="0.85" />
            <text x={x} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="middle"
              fill="var(--surface)" fontSize={7*s} fontFamily="inherit" fontWeight="600">
              {label}
            </text>
          </g>
        );
      })()}

      {/* Line hover tooltip */}
      {hoveredLine !== null && (() => {
        const lineVal = hoveredLine === 'goal' ? goalLine : avgLine;
        const prefix = hoveredLine === 'goal' ? 'Goal' : 'Avg';
        const label = `${prefix}: ${parseFloat(lineVal.toFixed(1))}${unit}`;
        const boxW = Math.max(label.length * 6.5 * s, 50 * s);
        const boxH = 18 * s;
        const offset = 10 * s;
        const wouldOverflowRight = mousePos.x + offset + boxW > W - 4*s;
        const boxX = wouldOverflowRight ? mousePos.x - offset - boxW : mousePos.x + offset;
        const rawY = mousePos.y - boxH / 2;
        const boxY = Math.max(padT, Math.min(rawY, padT + innerH - boxH));
        return (
          <g pointerEvents="none">
            <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={4*s} fill="var(--text)" opacity="0.85" />
            <text x={boxX + boxW / 2} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="middle"
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

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function WorkoutCalendar() {
  const [cards, setCards] = useState(loadWorkoutCards);
  const [log, setLog] = useState(loadWorkoutLog);
  const [input, setInput] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);
  const today = todayKey();
  const todayDate = new Date(today + 'T00:00:00');

  // Start from the month of the earliest log entry, or Jan 1 of current year
  const logDates = Object.keys(log).sort();
  const rawStart = logDates.length > 0
    ? new Date(logDates[0] + 'T00:00:00')
    : new Date(todayDate.getFullYear(), 0, 1);
  const startMonth = new Date(rawStart.getFullYear(), rawStart.getMonth(), 1);

  // Build month list from startMonth to current month
  const months = [];
  const cur = new Date(startMonth);
  while (cur.getFullYear() < todayDate.getFullYear() ||
        (cur.getFullYear() === todayDate.getFullYear() && cur.getMonth() <= todayDate.getMonth())) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  function saveCards(updated) {
    setCards(updated);
    localStorage.setItem('workout_cards', JSON.stringify(updated));
  }
  function saveLog(updated) {
    setLog(updated);
    localStorage.setItem('workout_log', JSON.stringify(updated));
  }
  function addCard() {
    const label = input.trim();
    if (!label) return;
    const usedColors = new Set(cards.map(c => c.color));
    const color = WORKOUT_COLORS.find(c => !usedColors.has(c)) ?? WORKOUT_COLORS[cards.length % WORKOUT_COLORS.length];
    saveCards([...cards, { id: Date.now(), label, color }]);
    setInput('');
  }
  function deleteCard(id) {
    saveCards(cards.filter(c => c.id !== id));
  }
  function applyCard(card) {
    saveLog({ ...log, [today]: { cardId: card.id, label: card.label } });
  }

  return (
    <div className={styles.workoutSection}>
      <h3 className={styles.workoutHeading}>Workouts</h3>

      <div className={styles.workoutCards}>
        {cards.map(card => (
          <div key={card.id} className={styles.workoutCard} style={{ borderColor: card.color }}>
            <button
              className={styles.workoutCardLabel}
              style={{ color: card.color }}
              onClick={() => applyCard(card)}
              title={`Log "${card.label}" for today`}
            >
              {card.label}
            </button>
            <button className={styles.workoutCardDelete} onClick={() => deleteCard(card.id)}>×</button>
          </div>
        ))}
        <div className={styles.workoutAddCard}>
          <input
            className={styles.workoutAddInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCard()}
            placeholder="Add workout…"
          />
          <button className={styles.workoutAddBtn} onClick={addCard} disabled={!input.trim()}>+</button>
        </div>
      </div>

      <div className={styles.calendarYears}>
        {Object.entries(
          months.reduce((acc, m) => {
            const yr = m.getFullYear();
            (acc[yr] = acc[yr] || []).push(m);
            return acc;
          }, {})
        ).map(([yr, yearMonths]) => (
          <div key={yr} className={styles.calendarYearGroup}>
            <div className={styles.calendarYearLabel}>{yr}</div>
            <div className={styles.calendarMonths}>
        {yearMonths.map(monthStart => {
          const mo = monthStart.getMonth();
          const daysInMonth = new Date(yr, mo + 1, 0).getDate();
          const firstDow = new Date(yr, mo, 1).getDay();
          const dayKeys = Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(Number(yr), mo, i + 1)));

          return (
            <div key={`${yr}-${mo}`} className={styles.calendarMonth}>
              <div className={styles.calendarMonthLabel}>
                {MONTH_NAMES[mo]}
              </div>
              <div className={styles.calendarGrid}>
                {Array.from({ length: firstDow }, (_, i) => <div key={`bl-${i}`} />)}
                {dayKeys.map(day => {
                  const isFuture = day > today;
                  const entry = log[day];
                  const card = entry ? cards.find(c => c.id === entry.cardId) : null;
                  const isDeleted = !!entry && !card;
                  const bg = isFuture ? 'transparent'
                    : card ? card.color
                    : isDeleted ? '#6b7fa3'
                    : 'var(--surface2)';
                  const isToday = day === today;
                  const d = new Date(day + 'T00:00:00');
                  const dateLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
                  return (
                    <div
                      key={day}
                      className={`${styles.calendarDay} ${isToday ? styles.calendarToday : ''} ${isFuture ? styles.calendarDayFuture : ''}`}
                      style={{ background: bg }}
                      onMouseEnter={() => !isFuture && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {hoveredDay === day && (
                        <div className={styles.calendarTooltip}>
                          <span className={styles.calendarTooltipDate}>{dateLabel}</span>
                          {entry && <span>{entry.label}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PIE_MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--protein)' },
  { key: 'carbs',   label: 'Carbs',   color: 'var(--carbs)'   },
  { key: 'fat',     label: 'Fat',     color: 'var(--fat)'     },
];

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function MacroPieChart({ logs }) {
  const [enabled, setEnabled] = useState({ protein: true, carbs: true, fat: true });
  const toggle = (key) => setEnabled(prev => ({ ...prev, [key]: !prev[key] }));

  const rawTotals = {};
  PIE_MACROS.forEach(({ key }) => {
    rawTotals[key] = getDailyData(logs, key).reduce((sum, d) => sum + d.total, 0);
  });

  const active = PIE_MACROS.filter(m => enabled[m.key] && rawTotals[m.key] > 0);
  const grandTotal = active.reduce((sum, m) => sum + rawTotals[m.key], 0);

  const cx = 100, cy = 100, r = 80, innerR = 44;
  let angle = 0;
  const slices = active.map(m => {
    const pct = rawTotals[m.key] / grandTotal;
    const start = angle;
    angle += pct * 360;
    return { ...m, pct, start, end: angle };
  });

  return (
    <div className={styles.pieSection}>
      <div className={styles.pieCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Macro Ratio</span>
          <span className={styles.cardAvg}>protein · carbs · fat</span>
        </div>
        <div className={styles.pieContent}>
          {grandTotal > 0 ? (
            <svg viewBox="0 0 200 200" className={styles.pieSvg}>
              {slices.map(({ key, color, pct, start, end }) => {
                if (pct >= 1) return <circle key={key} cx={cx} cy={cy} r={r} fill={color} />;
                const [x1, y1] = polarToCartesian(cx, cy, r, start);
                const [x2, y2] = polarToCartesian(cx, cy, r, end);
                const large = end - start > 180 ? 1 : 0;
                return (
                  <path key={key}
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                    fill={color} />
                );
              })}
              <circle cx={cx} cy={cy} r={innerR} fill="var(--surface)" />
            </svg>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📊</span>
              <p>No data yet</p>
            </div>
          )}
          <div className={styles.pieLegend}>
            {PIE_MACROS.map(({ key, label, color }) => {
              const pct = grandTotal > 0 && enabled[key] && rawTotals[key] > 0
                ? ((rawTotals[key] / grandTotal) * 100).toFixed(1)
                : null;
              return (
                <button key={key}
                  className={`${styles.pieLegendItem} ${!enabled[key] ? styles.pieLegendOff : ''}`}
                  onClick={() => toggle(key)}
                >
                  <span className={styles.pieLegendDot} style={{ background: enabled[key] ? color : 'var(--border)' }} />
                  <span className={styles.pieLegendLabel}>{label}</span>
                  {pct !== null && <span className={styles.pieLegendPct}>{pct}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Metrics() {
  const { logs, goals } = useOutletContext();
  const [syncDate, setSyncDate] = useState(null);

  return (
    <div>
      <h2 className={styles.heading}>Metrics</h2>
      <p className={styles.sub}>Track your trends over time.</p>

      <WeightSection syncDate={syncDate} onHoverDate={setSyncDate} />

      <div className={styles.grid}>
        {METRICS.map(({ key, label, unit, color, avgRule }) => {
          const data = getDailyData(logs, key);
          const avgNum = data.length > 0
            ? data.reduce((sum, d) => sum + d.total, 0) / data.length
            : null;
          const avg = avgNum !== null ? avgNum.toFixed(1) : null;
          const goal = goals?.[key];
          const color2 = avgColor(avgNum, goal, avgRule);
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
