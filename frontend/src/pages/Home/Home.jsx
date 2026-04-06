import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SummaryCards from '../../components/SummaryCards/SummaryCards';
import FoodChat from '../../components/FoodChat/FoodChat';
import AddFoodForm from '../../components/AddFoodForm/AddFoodForm';
import FoodLog from '../../components/FoodLog/FoodLog';
import SavedRecipes from '../../components/SavedRecipes/SavedRecipes';

export default function Home() {
  const { isPremium } = useAuth();
  const { totals, goals, addEntries, addEntry, currentLog, deleteEntry, updateEntry, currentDate, saveAndLogRecipe, refreshCurrentLog } = useOutletContext();

  return (
    <>
      <SummaryCards totals={totals} goals={goals} />
      <FoodChat onAddMany={addEntries} isPremium={isPremium} />
      <SavedRecipes currentDate={currentDate} onLogged={refreshCurrentLog} />
      <AddFoodForm onAdd={addEntry} onSaveRecipe={saveAndLogRecipe} />
      <FoodLog entries={currentLog} onDelete={deleteEntry} onUpdate={updateEntry} />
    </>
  );
}
