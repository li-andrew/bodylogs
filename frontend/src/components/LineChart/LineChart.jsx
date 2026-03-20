import { useState } from 'react';
import { formatDateShort } from '../../lib/dateUtils';
import styles from './LineChart.module.css';

export default function LineChart({ data, color, unit, startFromZero = true, scale = 1, H = 160, syncDate = null, onHoverDate, goalLine = null, avgLine = null, yMin = null }) {
  const [hovered, setHovered] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null);
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

  const yTicks = startFromZero
    ? [0, maxVal / 2, maxVal]
    : [minVal, minVal + (maxVal - minVal) * 0.5, maxVal];

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
      {yTicks.map(t => (
        <line key={t} x1={padL} x2={padL + innerW} y1={toY(t)} y2={toY(t)}
          stroke="var(--border)" strokeWidth={s} opacity="0.7" />
      ))}

      {yTicks.map(t => (
        <text key={t} x={padL - 6*s} y={toY(t)} textAnchor="end" dominantBaseline="middle"
          fill="var(--muted)" fontSize={labelSize} fontFamily="inherit">
          {fmtTick(t)}
        </text>
      ))}

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

      {goalLine != null && toY(goalLine) >= padT && toY(goalLine) <= padT + innerH && (
        <g onMouseEnter={() => setHoveredLine('goal')} onMouseLeave={() => setHoveredLine(null)}>
          <line x1={padL} x2={padL + innerW} y1={toY(goalLine)} y2={toY(goalLine)}
            stroke="transparent" strokeWidth={8*s} />
          <line x1={padL} x2={padL + innerW} y1={toY(goalLine)} y2={toY(goalLine)}
            stroke={color} strokeWidth={s} opacity="0.5" pointerEvents="none" />
        </g>
      )}

      {avgLine != null && toY(avgLine) >= padT && toY(avgLine) <= padT + innerH && (
        <g onMouseEnter={() => setHoveredLine('avg')} onMouseLeave={() => setHoveredLine(null)}>
          <line x1={padL} x2={padL + innerW} y1={toY(avgLine)} y2={toY(avgLine)}
            stroke="transparent" strokeWidth={8*s} />
          <line x1={padL} x2={padL + innerW} y1={toY(avgLine)} y2={toY(avgLine)}
            stroke={color} strokeWidth={s} strokeDasharray={`${4*s} ${3*s}`} opacity="0.35" pointerEvents="none" />
        </g>
      )}

      <polyline points={polyline} fill="none" stroke={color}
        strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />

      {xIndices.map(i => (
        <text key={i} x={toX(i)} y={H - 6*s} textAnchor="middle"
          fill="var(--muted)" fontSize={labelSize} fontFamily="inherit">
          {formatDateShort(data[i].date)}
        </text>
      ))}

      <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="var(--border)" strokeWidth={s} />
      <line x1={padL} x2={padL + innerW} y1={padT + innerH} y2={padT + innerH} stroke="var(--border)" strokeWidth={s} />

      {points.map(([x, y], i) => (
        <g key={i}
          onMouseEnter={() => { setHovered(i); onHoverDate?.(data[i].date); }}
          onMouseLeave={() => { setHovered(null); onHoverDate?.(null); }}
        >
          <circle cx={x} cy={y} r={dotHit} fill="transparent" />
          <circle cx={x} cy={y} r={hovered === i ? dotRHov : dotR} fill={color} stroke="var(--surface)" strokeWidth={2*s} />
        </g>
      ))}

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
