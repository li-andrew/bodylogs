import { useState } from 'react';
import { getDailyData } from '../../lib/logUtils';
import styles from './MacroPieChart.module.css';

const PIE_MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--protein)' },
  { key: 'carbs',   label: 'Carbs',   color: 'var(--carbs)'   },
  { key: 'fat',     label: 'Fat',     color: 'var(--fat)'     },
];

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export default function MacroPieChart({ logs }) {
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
