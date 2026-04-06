import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { food as foodApi } from '../api/food';

export function useRecipes() {
  const { token } = useAuth();
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!token) { setRecipes([]); return; }
    foodApi.getRecipes(token).then(setRecipes).catch(console.error);
  }, [token]);

  async function logRecipe(recipeId, date) {
    await foodApi.logRecipe(recipeId, { logged_at: date }, token);
  }

  async function deleteRecipe(recipeId) {
    await foodApi.deleteRecipe(recipeId, token);
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
  }

  function addRecipe(recipe) {
    setRecipes(prev => [recipe, ...prev]);
  }

  return { recipes, logRecipe, deleteRecipe, addRecipe };
}
