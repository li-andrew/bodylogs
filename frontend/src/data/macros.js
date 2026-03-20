export const MACROS = [
  { key: 'cal',     label: 'Calories', unit: 'kcal', color: 'var(--cal)' },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--protein)' },
  { key: 'carbs',   label: 'Carbs',    unit: 'g',    color: 'var(--carbs)' },
  { key: 'fat',     label: 'Fat',      unit: 'g',    color: 'var(--fat)' },
  { key: 'sodium',  label: 'Sodium',   unit: 'mg',   color: 'var(--sodium)' },
  { key: 'sugar',   label: 'Sugar',    unit: 'g',    color: 'var(--sugar)' },
];

export const MACRO_KEYS = MACROS.map(m => m.key);
