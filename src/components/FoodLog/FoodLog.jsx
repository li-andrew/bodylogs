import { useState } from 'react';
import FoodLogItem from './FoodLogItem';
import EditFoodModal from './EditFoodModal';
import styles from './FoodLog.module.css';

export default function FoodLog({ entries, onDelete, onUpdate }) {
  const [editingEntry, setEditingEntry] = useState(null);

  function handleSave(id, fields) {
    onUpdate(id, fields);
    setEditingEntry(null);
  }

  return (
    <section>
      <h2 className={styles.heading}>Today's Log</h2>

      {entries.length === 0 ? (
        <p className={styles.empty}>No food logged yet. Add something above.</p>
      ) : (
        <div className={styles.list}>
          {[...entries].reverse().map(entry => (
            <FoodLogItem
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onEdit={setEditingEntry}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <EditFoodModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
