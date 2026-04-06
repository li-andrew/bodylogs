import { useState } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTracker } from './hooks/useTracker';
import Header from './components/Header/Header';
import GoalsModal from './components/GoalsModal/GoalsModal';
import Home from './pages/Home/Home';
import Metrics from './pages/Metrics/Metrics';
import Login from './pages/Login/Login';
import styles from './App.module.css';

function Layout({ tracker }) {
  const { logout } = useAuth();
  const [goalsOpen, setGoalsOpen] = useState(false);

  return (
    <div className={styles.app}>
      <Header
        currentDate={tracker.currentDate}
        onPrevDay={tracker.prevDay}
        onNextDay={tracker.nextDay}
        onOpenGoals={() => setGoalsOpen(true)}
        onLogout={logout}
      />
      <GoalsModal
        isOpen={goalsOpen}
        goals={tracker.goals}
        goalWeight={tracker.goalWeight}
        onClose={() => setGoalsOpen(false)}
        onSave={(g) => { tracker.updateGoals(g); setGoalsOpen(false); }}
      />
      <Outlet context={{
        logs:              tracker.logs,
        goals:             tracker.goals,
        goalWeight:        tracker.goalWeight,
        totals:            tracker.totals,
        currentDate:       tracker.currentDate,
        currentLog:        tracker.currentLog,
        addEntry:          tracker.addEntry,
        addEntries:        tracker.addEntries,
        deleteEntry:       tracker.deleteEntry,
        updateEntry:       tracker.updateEntry,
        saveAndLogRecipe:  tracker.saveAndLogRecipe,
        refreshCurrentLog: tracker.refreshCurrentLog,
      }} />
    </div>
  );
}

function ProtectedApp() {
  const tracker = useTracker();
  return (
    <Routes>
      <Route element={<Layout tracker={tracker} />}>
        <Route path="/" element={<Home />} />
        <Route path="/metrics" element={<Metrics />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { token } = useAuth();

  if (!token) return <Login />;
  return <ProtectedApp />;
}
