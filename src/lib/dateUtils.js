export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function shiftDate(key, days) {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function formatDateLabel(key) {
  const today = todayKey();
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yKey = dateKey(yDate);

  if (key === today) return 'Today';
  if (key === yKey) return 'Yesterday';

  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateShort(key) {
  const d = new Date(key + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
