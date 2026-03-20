import { useState } from 'react';
import { useWorkouts } from '../../hooks/useWorkouts';
import { todayKey, dateKey, MONTH_NAMES } from '../../lib/dateUtils';
import styles from './WorkoutCalendar.module.css';

export default function WorkoutCalendar() {
  const { cards, log, addCard, deleteCard, applyCard } = useWorkouts();
  const [input, setInput] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);
  const today = todayKey();
  const todayDate = new Date(today + 'T00:00:00');

  const logDates = Object.keys(log).sort();
  const rawStart = logDates.length > 0
    ? new Date(logDates[0] + 'T00:00:00')
    : new Date(todayDate.getFullYear(), 0, 1);
  const startMonth = new Date(rawStart.getFullYear(), rawStart.getMonth(), 1);

  const months = [];
  const cur = new Date(startMonth);
  while (cur.getFullYear() < todayDate.getFullYear() ||
        (cur.getFullYear() === todayDate.getFullYear() && cur.getMonth() <= todayDate.getMonth())) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  function handleAddCard() {
    const label = input.trim();
    if (!label) return;
    addCard(label);
    setInput('');
  }

  return (
    <div className={styles.workoutSection}>
      <h3 className={styles.workoutHeading}>Workouts</h3>

      <div className={styles.workoutCards}>
        {cards.map(card => (
          <div key={card.id} className={styles.workoutCard} style={{ borderColor: card.color }}>
            <button
              className={styles.workoutCardLabel}
              style={{ color: card.color }}
              onClick={() => applyCard(card)}
              title={`Log "${card.label}" for today`}
            >
              {card.label}
            </button>
            <button className={styles.workoutCardDelete} onClick={() => deleteCard(card.id)}>×</button>
          </div>
        ))}
        <div className={styles.workoutAddCard}>
          <input
            className={styles.workoutAddInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCard()}
            placeholder="Add workout…"
          />
          <button className={styles.workoutAddBtn} onClick={handleAddCard} disabled={!input.trim()}>+</button>
        </div>
      </div>

      <div className={styles.calendarYears}>
        {Object.entries(
          months.reduce((acc, m) => {
            const yr = m.getFullYear();
            (acc[yr] = acc[yr] || []).push(m);
            return acc;
          }, {})
        ).map(([yr, yearMonths]) => (
          <div key={yr} className={styles.calendarYearGroup}>
            <div className={styles.calendarYearLabel}>{yr}</div>
            <div className={styles.calendarMonths}>
              {yearMonths.map(monthStart => {
                const mo = monthStart.getMonth();
                const daysInMonth = new Date(Number(yr), mo + 1, 0).getDate();
                const firstDow = new Date(Number(yr), mo, 1).getDay();
                const dayKeys = Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(Number(yr), mo, i + 1)));

                return (
                  <div key={`${yr}-${mo}`} className={styles.calendarMonth}>
                    <div className={styles.calendarMonthLabel}>
                      {MONTH_NAMES[mo]}
                    </div>
                    <div className={styles.calendarGrid}>
                      {Array.from({ length: firstDow }, (_, i) => <div key={`bl-${i}`} />)}
                      {dayKeys.map(day => {
                        const isFuture = day > today;
                        const entry = log[day];
                        const card = entry ? cards.find(c => c.id === entry.cardId) : null;
                        const isDeleted = !!entry && !card;
                        const bg = isFuture ? 'transparent'
                          : card ? card.color
                          : isDeleted ? '#6b7fa3'
                          : 'var(--surface2)';
                        const isToday = day === today;
                        const d = new Date(day + 'T00:00:00');
                        const dateLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
                        return (
                          <div
                            key={day}
                            className={`${styles.calendarDay} ${isToday ? styles.calendarToday : ''} ${isFuture ? styles.calendarDayFuture : ''}`}
                            style={{ background: bg }}
                            onMouseEnter={() => !isFuture && setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                          >
                            {hoveredDay === day && (
                              <div className={styles.calendarTooltip}>
                                <span className={styles.calendarTooltipDate}>{dateLabel}</span>
                                {entry && <span>{entry.label}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
