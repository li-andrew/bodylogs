import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useTracker } from './hooks/useTracker';
import Header from './components/Header/Header';
import SummaryCards from './components/SummaryCards/SummaryCards';
import FoodChat from './components/FoodChat/FoodChat';
import AddFoodForm from './components/AddFoodForm/AddFoodForm';
import FoodLog from './components/FoodLog/FoodLog';
import GoalsModal from './components/GoalsModal/GoalsModal';
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
      <Outlet context={{ logs: tracker.logs }} />
    </div>
  );
}

export default function App() {
  const tracker = useTracker();

  return (
    <Routes>
      <Route element={<Layout tracker={tracker} />}>
        <Route path="/" element={
          <>
            <SummaryCards totals={tracker.totals} goals={tracker.goals} />
            <FoodChat onAddMany={tracker.addEntries} />
            <AddFoodForm onAdd={tracker.addEntry} />
            <FoodLog entries={tracker.currentLog} onDelete={tracker.deleteEntry} onUpdate={tracker.updateEntry} />
          </>
        } />
        <Route path="/metrics" element={<Metrics />} />
      </Route>
    </Routes>
  );
}
