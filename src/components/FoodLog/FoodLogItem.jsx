import styles from './FoodLog.module.css';

const MACROS = [
  { key: 'cal',     label: 'kcal',    color: 'var(--cal)',     fmt: v => Math.round(v)        },
  { key: 'protein', label: 'protein', color: 'var(--protein)', fmt: v => v.toFixed(1) + 'g'  },
  { key: 'carbs',   label: 'carbs',   color: 'var(--carbs)',   fmt: v => v.toFixed(1) + 'g'  },
  { key: 'fat',     label: 'fat',     color: 'var(--fat)',     fmt: v => v.toFixed(1) + 'g'  },
  { key: 'sodium',  label: 'sodium',  color: 'var(--sodium)',  fmt: v => Math.round(v) + 'mg' },
  { key: 'sugar',   label: 'sugar',   color: 'var(--sugar)',   fmt: v => v.toFixed(1) + 'g'  },
];

export default function FoodLogItem({ entry, onDelete, onEdit }) {
  return (
    <div className={styles.item}>
      <span className={styles.name}>
        {entry.name}
        {entry.fromAI && <span className={styles.aiBadge}>AI</span>}
        {entry.recipe && (
          <span className={styles.recipeWrapper}>
            <span className={styles.recipeBadge}>Recipe</span>
            <div className={styles.recipePopover}>
                <div className={styles.recipePopoverRow}>
                  <span className={styles.recipePopoverName}>Ingredients</span>
                  <span className={styles.rpWeight}>weight</span>
                  <span className={styles.rpCal}>kcal</span>
                  <span className={styles.rpProtein}>protein</span>
                  <span className={styles.rpCarbs}>carbs</span>
                  <span className={styles.rpFat}>fat</span>
                  <span className={styles.rpSodium}>sodium</span>
                  <span className={styles.rpSugar}>sugar</span>
                </div>
                {(entry.ingredients || []).map((ing, i) => (
                  <div key={i} className={styles.recipePopoverRow}>
                    <span className={styles.recipePopoverName}>{ing.name}</span>
                    <span className={styles.rpWeight}>{ing.grams != null ? `${ing.grams}g` : '—'}</span>
                    <span className={styles.rpCal}>{Math.round(ing.cal ?? 0)}</span>
                    <span className={styles.rpProtein}>{(ing.protein ?? 0).toFixed(1)}g</span>
                    <span className={styles.rpCarbs}>{(ing.carbs ?? 0).toFixed(1)}g</span>
                    <span className={styles.rpFat}>{(ing.fat ?? 0).toFixed(1)}g</span>
                    <span className={styles.rpSodium}>{Math.round(ing.sodium ?? 0)}mg</span>
                    <span className={styles.rpSugar}>{(ing.sugar ?? 0).toFixed(1)}g</span>
                  </div>
                ))}
            </div>
          </span>
        )}
        {entry.grams != null && <span className={styles.entryGrams}>{entry.grams}g</span>}
      </span>

      {MACROS.map(({ key, label, color, fmt }) => (
        <div key={key} className={styles.macro}>
          <span className={styles.val} style={{ color }}>{fmt(entry[key] ?? 0)}</span>
          <span className={styles.lbl}>{label}</span>
        </div>
      ))}

      <button className={styles.editBtn} onClick={() => onEdit(entry)} title="Edit">&#x270E;</button>
      <button className={styles.deleteBtn} onClick={() => onDelete(entry.id)} title="Remove">&#x2715;</button>
    </div>
  );
}
