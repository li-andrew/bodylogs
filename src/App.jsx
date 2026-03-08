import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useTracker } from './hooks/useTracker';
import Header from './components/Header/Header';
import GoalsModal from './components/GoalsModal/GoalsModal';
import Home from './pages/Home/Home';
import Metrics from './pages/Metrics/Metrics';
import styles from './App.module.css';

function Layout({ tracker }) {
  const [goalsOpen, setGoalsOpen] = useState(false);

  return (
    <div className={styles.app}>
      <Header
        currentDate={tracker.currentDate}
        onPrevDay={tracker.prevDay}
        onNextDay={tracker.nextDay}
        onOpenGoals={() => setGoalsOpen(true)}
      />
      <GoalsModal
        isOpen={goalsOpen}
        goals={tracker.goals}
        onClose={() => setGoalsOpen(false)}
        onSave={(g) => { tracker.updateGoals(g); setGoalsOpen(false); }}
      />
      <Outlet context={{ logs: tracker.logs, goals: tracker.goals }} />
    </div>
  );
}

export default function App() {
  const tracker = useTracker();

  return (
    <Routes>
      <Route element={<Layout tracker={tracker} />}>
        <Route path="/" element={
          <Home
            totals={tracker.totals}
            goals={tracker.goals}
            onAddMany={tracker.addEntries}
            onAdd={tracker.addEntry}
            entries={tracker.currentLog}
            onDelete={tracker.deleteEntry}
            onUpdate={tracker.updateEntry}
          />
        } />
        <Route path="/metrics" element={<Metrics />} />
      </Route>
    </Routes>
  );
}
