export function getDailyData(logs, key) {
  const dates = Object.keys(logs).sort();
  return dates.map(date => {
    const entries = logs[date] || [];
    const total = entries.reduce((sum, e) => sum + (e[key] ?? 0), 0);
    return { date, total };
  });
}
