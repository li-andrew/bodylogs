import { MACROS } from '../../data/macros';
import MacroCard from './MacroCard';
import styles from './SummaryCards.module.css';

export default function SummaryCards({ totals, goals }) {
  return (
    <div className={styles.grid}>
      {MACROS.map(({ key, label, unit, color }) => (
        <MacroCard
          key={key}
          label={label}
          unit={unit}
          color={color}
          value={totals[key]}
          goal={goals[key]}
        />
      ))}
    </div>
  );
}
