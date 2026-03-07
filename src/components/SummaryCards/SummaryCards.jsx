import MacroCard from './MacroCard';
import styles from './SummaryCards.module.css';

const CARDS = [
  { key: 'cal',     label: 'Calories', unit: 'kcal', color: 'var(--cal)'     },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--protein)' },
  { key: 'carbs',   label: 'Carbs',    unit: 'g',    color: 'var(--carbs)'   },
  { key: 'fat',     label: 'Fat',      unit: 'g',    color: 'var(--fat)'     },
  { key: 'sodium',  label: 'Sodium',   unit: 'mg',   color: 'var(--sodium)'  },
  { key: 'sugar',   label: 'Sugar',    unit: 'g',    color: 'var(--sugar)'   },
];

export default function SummaryCards({ totals, goals }) {
  return (
    <div className={styles.grid}>
      {CARDS.map(({ key, label, unit, color }) => (
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
