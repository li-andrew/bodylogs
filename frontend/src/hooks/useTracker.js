import { useState, useEffect } from 'react';
import { DEFAULT_GOALS } from '../data/defaultGoals';
import { MACRO_KEYS } from '../data/macros';
import { todayKey, shiftDate } from '../lib/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { food as foodApi } from '../api/food';

// Map a food log row from the API to the shape the UI expects
function mapLogEntry(row) {
  return {
    id: row.id,
    food_item_id: row.food_item_id,
    name: row.name,
    cal: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    sodium: Number(row.sodium ?? 0),
    sugar: Number(row.sugar ?? 0),
    ...(row.grams != null ? { grams: Number(row.grams) } : {}),
    servings: Number(row.servings),
    logged_at: String(row.logged_at).slice(0, 10),
  };
}

// Map goals row from the API to the shape the UI expects.
// sodium/sugar goals live in localStorage since the DB schema doesn't include them yet.
function mapGoals(row) {
  const sodium = parseFloat(localStorage.getItem('goal_sodium')) || DEFAULT_GOALS.sodium;
  const sugar  = parseFloat(localStorage.getItem('goal_sugar'))  || DEFAULT_GOALS.sugar;
  if (!row) return { ...DEFAULT_GOALS };
  return {
    cal:     Number(row.calories) || DEFAULT_GOALS.cal,
    protein: Number(row.protein)  || DEFAULT_GOALS.protein,
    carbs:   Number(row.carbs)    || DEFAULT_GOALS.carbs,
    fat:     Number(row.fat)      || DEFAULT_GOALS.fat,
    sodium,
    sugar,
  };
}

export function useTracker() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(todayKey);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [goalWeight, setGoalWeight] = useState(null);
  const [logs, setLogs] = useState({});

  // Load all food logs and goals on mount (or when token changes)
  useEffect(() => {
    if (!token) { setLogs({}); setGoals(DEFAULT_GOALS); setGoalWeight(null); return; }

    foodApi.getAllLogs(token).then(rows => {
      const grouped = {};
      for (const row of rows) {
        const date = String(row.logged_at).slice(0, 10);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(mapLogEntry(row));
      }
      setLogs(grouped);
    }).catch(console.error);

    foodApi.getGoals(token).then(row => {
      setGoals(mapGoals(row));
      setGoalWeight(row?.weight ? Number(row.weight) : null);
    }).catch(console.error);
  }, [token]);

  const currentLog = logs[currentDate] ?? [];

  async function addEntry(entry) {
    // 1. Create the food item (stores the nutrition per serving)
    const item = await foodApi.createItem({
      name:     entry.name,
      calories: entry.cal,
      protein:  entry.protein,
      carbs:    entry.carbs,
      fat:      entry.fat,
      sodium:   entry.sodium ?? 0,
      sugar:    entry.sugar  ?? 0,
      grams:    entry.grams  ?? null,
    }, token);

    // 2. Log it for the current date
    const log = await foodApi.createLog({
      food_item_id: item.id,
      servings:     1,
      logged_at:    currentDate,
    }, token);

    // 3. Optimistically update local state
    const newEntry = {
      id:           log.id,
      food_item_id: item.id,
      name:         entry.name,
      cal:          entry.cal,
      protein:      entry.protein,
      carbs:        entry.carbs,
      fat:          entry.fat,
      sodium:       entry.sodium ?? 0,
      sugar:        entry.sugar  ?? 0,
      ...(entry.grams != null ? { grams: entry.grams } : {}),
      servings:     1,
      logged_at:    currentDate,
    };
    setLogs(prev => ({ ...prev, [currentDate]: [...(prev[currentDate] ?? []), newEntry] }));
  }

  async function addEntries(newEntries) {
    for (const entry of newEntries) {
      await addEntry(entry);
    }
  }

  async function deleteEntry(id) {
    await foodApi.deleteLog(id, token);
    setLogs(prev => ({
      ...prev,
      [currentDate]: (prev[currentDate] ?? []).filter(e => e.id !== id),
    }));
  }

  async function updateEntry(id, fields) {
    const entry = (logs[currentDate] ?? []).find(e => e.id === id);
    if (!entry) return;

    // Update the underlying food item with the new nutrition values
    await foodApi.updateItem(entry.food_item_id, {
      name:     fields.name,
      calories: fields.cal,
      protein:  fields.protein,
      carbs:    fields.carbs,
      fat:      fields.fat,
      sodium:   fields.sodium ?? 0,
      sugar:    fields.sugar  ?? 0,
      grams:    fields.grams  ?? null,
    }, token);

    setLogs(prev => ({
      ...prev,
      [currentDate]: (prev[currentDate] ?? []).map(e => e.id === id ? { ...e, ...fields } : e),
    }));
  }

  // newGoals shape: { cal, protein, carbs, fat, sodium, sugar, weight }
  async function updateGoals(newGoals) {
    // sodium/sugar aren't in the DB schema yet — keep them in localStorage
    localStorage.setItem('goal_sodium', String(newGoals.sodium));
    localStorage.setItem('goal_sugar',  String(newGoals.sugar));

    await foodApi.updateGoals({
      calories: newGoals.cal,
      protein:  newGoals.protein,
      carbs:    newGoals.carbs,
      fat:      newGoals.fat,
      weight:   newGoals.weight ?? 0,
    }, token);

    setGoals({
      cal:     newGoals.cal,
      protein: newGoals.protein,
      carbs:   newGoals.carbs,
      fat:     newGoals.fat,
      sodium:  newGoals.sodium,
      sugar:   newGoals.sugar,
    });
    setGoalWeight(newGoals.weight ?? null);
  }

  async function refreshCurrentLog() {
    const rows = await foodApi.getLogsByDate(currentDate, token);
    setLogs(prev => ({ ...prev, [currentDate]: rows.map(mapLogEntry) }));
  }

  // Creates food items for each ingredient, saves a recipe, logs it, then refreshes the log
  async function saveAndLogRecipe(recipeName, ingredients) {
    const items = [];
    for (const ing of ingredients) {
      const item = await foodApi.createItem({
        name:     ing.name,
        calories: ing.cal,
        protein:  ing.protein,
        carbs:    ing.carbs,
        fat:      ing.fat,
        sodium:   ing.sodium ?? 0,
        sugar:    ing.sugar  ?? 0,
        grams:    ing.grams  ?? null,
      }, token);
      items.push({ food_item_id: item.id, servings: 1 });
    }

    const recipe = await foodApi.createRecipe({ name: recipeName, items }, token);
    await foodApi.logRecipe(recipe.id, { logged_at: currentDate }, token);
    await refreshCurrentLog();
  }

  const totals = currentLog.reduce(
    (acc, e) => {
      const next = {};
      MACRO_KEYS.forEach(k => { next[k] = acc[k] + (e[k] ?? 0); });
      return next;
    },
    Object.fromEntries(MACRO_KEYS.map(k => [k, 0])),
  );

  return {
    currentDate,
    currentLog,
    logs,
    goals,
    goalWeight,
    totals,
    addEntry,
    addEntries,
    deleteEntry,
    updateEntry,
    updateGoals,
    refreshCurrentLog,
    saveAndLogRecipe,
    prevDay: () => setCurrentDate(d => shiftDate(d, -1)),
    nextDay: () => setCurrentDate(d => shiftDate(d, 1)),
  };
}
