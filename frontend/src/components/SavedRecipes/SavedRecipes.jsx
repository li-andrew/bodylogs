import { useRecipes } from '../../hooks/useRecipes';
import { MACRO_KEYS } from '../../data/macros';
import styles from './SavedRecipes.module.css';

function recipeTotals(recipe) {
  return (recipe.items || []).reduce((acc, item) => {
    const s = Number(item.servings) || 1;
    MACRO_KEYS.forEach(k => {
      const src = k === 'cal' ? 'calories' : k;
      acc[k] = (acc[k] || 0) + (Number(item[src]) || 0) * s;
    });
    return acc;
  }, {});
}

export default function SavedRecipes({ currentDate, onLogged }) {
  const { recipes, logRecipe, deleteRecipe } = useRecipes();

  if (recipes.length === 0) return null;

  async function handleLog(recipeId) {
    await logRecipe(recipeId, currentDate);
    onLogged();
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Saved Recipes</h2>
      <div className={styles.list}>
        {recipes.map(recipe => {
          const t = recipeTotals(recipe);
          return (
            <div key={recipe.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <span className={styles.name}>{recipe.name}</span>
                <span className={styles.macros}>
                  {Math.round(t.cal)} kcal · {t.protein?.toFixed(1)}g protein · {t.carbs?.toFixed(1)}g carbs · {t.fat?.toFixed(1)}g fat
                </span>
              </div>
              <div className={styles.actions}>
                <button className={styles.logBtn} onClick={() => handleLog(recipe.id)}>Log</button>
                <button className={styles.deleteBtn} onClick={() => deleteRecipe(recipe.id)}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
