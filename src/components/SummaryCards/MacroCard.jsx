import styles from './SummaryCards.module.css';

function pct(val, goal) {
  return Math.min(100, goal > 0 ? (val / goal) * 100 : 0) + '%';
}

function remainingLabel(val, goal) {
  const r = goal - Math.round(val);
  if (r > 0) return `${r} remaining`;
  if (r === 0) return 'goal met!';
  return `${Math.abs(r)} over`;
}

export default function MacroCard({ label, value, goal, unit, color }) {
  const displayValue = (unit === 'kcal' || unit === 'mg')
    ? Math.round(value)
    : value.toFixed(1);

  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue} style={{ color }}>
        {displayValue}{unit !== 'kcal' ? unit : ''}
      </div>
      <div className={styles.cardSub}>
        / {goal}{unit !== 'kcal' ? unit : ' kcal'} &middot;{' '}
        <span style={value > goal ? { color: '#f6b26b' } : undefined}>
          {remainingLabel(value, goal)}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: pct(value, goal), background: color }}
        />
      </div>
    </div>
  );
}
