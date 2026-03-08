import { useState, useRef } from 'react';
import { updateFoodEntry } from '../../lib/claudeParser';
import styles from './EditFoodModal.module.css';

export default function EditFoodModal({ entry, onClose, onSave }) {
  const [fields, setFields] = useState(entry);
  const [aiText, setAiText] = useState('');
  const [aiStatus, setAiStatus] = useState('idle'); // idle | loading | error
  const aiInputRef = useRef(null);

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  async function handleAiUpdate(e) {
    e?.preventDefault();
    const trimmed = aiText.trim();
    if (!trimmed || aiStatus === 'loading') return;

    setAiStatus('loading');
    try {
      const updated = await updateFoodEntry(fields, trimmed);
      setFields(prev => ({ ...prev, ...updated }));
      setAiText('');
      setAiStatus('idle');
    } catch {
      setAiStatus('error');
    }
    aiInputRef.current?.focus();
  }

  function handleSave() {
    const g = parseFloat(fields.grams);
    onSave(entry.id, {
      name:    fields.name.trim(),
      ...(isNaN(g) ? {} : { grams: g }),
      cal:     parseFloat(fields.cal)     || 0,
      protein: parseFloat(fields.protein) || 0,
      carbs:   parseFloat(fields.carbs)   || 0,
      fat:     parseFloat(fields.fat)     || 0,
      sodium:  parseFloat(fields.sodium)  || 0,
      sugar:   parseFloat(fields.sugar)   || 0,
    });
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Edit Entry</h2>

        <form className={styles.aiRow} onSubmit={handleAiUpdate}>
          <input
            ref={aiInputRef}
            className={styles.aiInput}
            value={aiText}
            onChange={e => { setAiText(e.target.value); setAiStatus('idle'); }}
            placeholder='e.g. "also had chimichurri sauce"'
            disabled={aiStatus === 'loading'}
          />
          <button
            type="submit"
            className={styles.aiBtn}
            disabled={!aiText.trim() || aiStatus === 'loading'}
          >
            {aiStatus === 'loading' ? <span className={styles.spinner} /> : 'Update'}
          </button>
        </form>
        {aiStatus === 'error' && (
          <p className={styles.aiError}>Could not update — try rephrasing.</p>
        )}

        <div className={styles.divider} />

        <div className={styles.field}>
          <label>Food Name</label>
          <input value={fields.name} onChange={e => set('name', e.target.value)} />
        </div>
        {[
          { key: 'grams',   label: 'Weight (g)'      },
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
              type="number" min="0" step="0.1"
              value={fields[key]}
              onChange={e => set(key, e.target.value)}
            />
          </div>
        ))}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
