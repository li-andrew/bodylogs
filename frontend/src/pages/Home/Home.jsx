import { useOutletContext } from 'react-router-dom';
import SummaryCards from '../../components/SummaryCards/SummaryCards';
import FoodChat from '../../components/FoodChat/FoodChat';
import AddFoodForm from '../../components/AddFoodForm/AddFoodForm';
import FoodLog from '../../components/FoodLog/FoodLog';

export default function Home() {
  const { totals, goals, addEntries, addEntry, currentLog, deleteEntry, updateEntry } = useOutletContext();

  return (
    <>
      <SummaryCards totals={totals} goals={goals} />
      <FoodChat onAddMany={addEntries} />
      <AddFoodForm onAdd={addEntry} />
      <FoodLog entries={currentLog} onDelete={deleteEntry} onUpdate={updateEntry} />
    </>
  );
}
