import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

function formatDateLabel(key) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  if (key === today) return 'Today';
  if (key === yKey) return 'Yesterday';

  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Header({ currentDate, onPrevDay, onNextDay, onOpenGoals }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.left} />

      <div className={styles.center}>
        {isHome && (
          <nav className={styles.dateNav}>
            <button className={styles.navBtn} onClick={onPrevDay}>&#8249;</button>
            <span className={styles.dateLabel}>{formatDateLabel(currentDate)}</span>
            <button className={styles.navBtn} onClick={onNextDay}>&#8250;</button>
          </nav>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.dropdownWrapper} ref={menuRef}>
          <button className={styles.hamburgerBtn} onClick={() => setOpen(o => !o)} aria-label="Menu">
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </button>
          {open && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.dropdownItem}
                onClick={() => { setOpen(false); onOpenGoals(); }}
              >
                Set new goals
              </button>
              {isHome ? (
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setOpen(false); navigate('/metrics'); }}
                >
                  View metrics
                </button>
              ) : (
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setOpen(false); navigate('/'); }}
                >
                  View daily logs
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
