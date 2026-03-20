import { useState, useEffect } from 'react';
import styles from './GoalsModal.module.css';

export default function GoalsModal({ isOpen, goals, onClose, onSave }) {
  const [fields, setFields] = useState(goals);
  const [goalWeight, setGoalWeight] = useState('');

  // Sync fields when modal opens with latest goals
  useEffect(() => {
    if (isOpen) {
      setFields(goals);
      const stored = localStorage.getItem('weight_goal');
      setGoalWeight(stored ?? '');
    }
  }, [isOpen, goals]);

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const gw = parseFloat(goalWeight);
    if (!isNaN(gw) && gw > 0) localStorage.setItem('weight_goal', String(gw));
    onSave({
      cal:     parseFloat(fields.cal)     || goals.cal,
      protein: parseFloat(fields.protein) || goals.protein,
      carbs:   parseFloat(fields.carbs)   || goals.carbs,
      fat:     parseFloat(fields.fat)     || goals.fat,
      sodium:  parseFloat(fields.sodium)  || goals.sodium,
      sugar:   parseFloat(fields.sugar)   || goals.sugar,
    });
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Daily Goals</h2>

        {[
          { key: 'cal',     label: 'Calories (kcal)' },
          { key: 'protein', label: 'Protein (g)'     },
          { key: 'carbs',   label: 'Carbs (g)'       },
          { key: 'fat',     label: 'Fat (g)'          },
          { key: 'sodium',  label: 'Sodium (mg)'     },
          { key: 'sugar',   label: 'Sugar (g)'        },
        ].map(({ key, label }) => (
          <div key={key} className={styles.field}>
            <label>{label}</label>
            <input
              type="number"
              min="0"
              value={fields[key]}
              onChange={e => set(key, e.target.value)}
            />
          </div>
        ))}

        <div className={styles.field}>
          <label>Goal Weight (lbs)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={goalWeight}
            onChange={e => setGoalWeight(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn}   onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
