import { useOutletContext } from 'react-router-dom';
import SummaryCards from '../../components/SummaryCards/SummaryCards';
import FoodChat from '../../components/FoodChat/FoodChat';
import AddFoodForm from '../../components/AddFoodForm/AddFoodForm';
import FoodLog from '../../components/FoodLog/FoodLog';

export default function Home({ totals, goals, onAddMany, onAdd, entries, onDelete, onUpdate }) {
  return (
    <>
      <SummaryCards totals={totals} goals={goals} />
      <FoodChat onAddMany={onAddMany} />
      <AddFoodForm onAdd={onAdd} />
      <FoodLog entries={entries} onDelete={onDelete} onUpdate={onUpdate} />
    </>
  );
}
