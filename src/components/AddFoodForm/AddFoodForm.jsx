import { useState, useRef } from 'react';
import { QUICK_FOODS } from '../../data/quickFoods';
import styles from './AddFoodForm.module.css';

const EMPTY = { name: '', cal: '', protein: '', carbs: '', fat: '', sodium: '', sugar: '' };

const NUTRIENT_IDS = { 1008: 'cal', 1003: 'protein', 1005: 'carbs', 1004: 'fat', 1093: 'sodium', 2000: 'sugar' };

const MACRO_KEYS = ['cal', 'protein', 'carbs', 'fat', 'sodium', 'sugar'];

function sumIngredients(ingredients) {
  return MACRO_KEYS.reduce((acc, k) => {
    acc[k] = Math.round(ingredients.reduce((s, ing) => s + (ing[k] || 0), 0) * 10) / 10;
    return acc;
  }, {});
}

export default function AddFoodForm({ onAdd }) {
  const [fields, setFields] = useState(EMPTY);
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [baseNutrients, setBaseNutrients] = useState(null);
  const [grams, setGrams] = useState('');
  const [recipeMode, setRecipeMode] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const debounceRef = useRef(null);

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function fillQuick(food) {
    setBaseNutrients(null);
    setGrams('');
    setFields({
      name:    food.name,
      cal:     food.cal,
      protein: food.protein,
      carbs:   food.carbs,
      fat:     food.fat,
      sodium:  food.sodium ?? '',
      sugar:   food.sugar  ?? '',
    });
  }

  function handleNameChange(value) {
    set('name', value);
    setBaseNutrients(null);
    setGrams('');
    clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(value)}&pageSize=7&api_key=${import.meta.env.VITE_USDA_API_KEY}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || res.statusText);
        setSuggestions(data.foods || []);
        setShowDrop(data.foods?.length > 0);
      } catch (err) {
        console.error('USDA search failed:', err.message);
        setSuggestions([]);
      }
    }, 350);
  }

  function selectSuggestion(food) {
    const nutrients = {};
    (food.foodNutrients || []).forEach(n => {
      const key = NUTRIENT_IDS[n.nutrientId];
      if (key) nutrients[key] = Math.round(n.value * 10) / 10;
    });
    setBaseNutrients(nutrients);
    setGrams('100');
    setFields({
      name:    food.description,
      cal:     nutrients.cal     ?? '',
      protein: nutrients.protein ?? '',
      carbs:   nutrients.carbs   ?? '',
      fat:     nutrients.fat     ?? '',
      sodium:  nutrients.sodium  ?? '',
      sugar:   nutrients.sugar   ?? '',
    });
    setSuggestions([]);
    setShowDrop(false);
  }

  function handleGramsChange(value) {
    setGrams(value);
    if (!baseNutrients) return;
    const g = parseFloat(value);
    if (isNaN(g) || g < 0) return;
    const r = g / 100;
    setFields(prev => ({
      ...prev,
      cal:     baseNutrients.cal     != null ? Math.round(baseNutrients.cal     * r * 10) / 10 : prev.cal,
      protein: baseNutrients.protein != null ? Math.round(baseNutrients.protein * r * 10) / 10 : prev.protein,
      carbs:   baseNutrients.carbs   != null ? Math.round(baseNutrients.carbs   * r * 10) / 10 : prev.carbs,
      fat:     baseNutrients.fat     != null ? Math.round(baseNutrients.fat     * r * 10) / 10 : prev.fat,
      sodium:  baseNutrients.sodium  != null ? Math.round(baseNutrients.sodium  * r * 10) / 10 : prev.sodium,
      sugar:   baseNutrients.sugar   != null ? Math.round(baseNutrients.sugar   * r * 10) / 10 : prev.sugar,
    }));
  }

  function clearForm() {
    setFields(EMPTY);
    setBaseNutrients(null);
    setGrams('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (recipeMode) { addToRecipe(); return; }
    const g = parseFloat(grams);
    onAdd({
      name:    fields.name.trim(),
      cal:     parseFloat(fields.cal)     || 0,
      protein: parseFloat(fields.protein) || 0,
      carbs:   parseFloat(fields.carbs)   || 0,
      fat:     parseFloat(fields.fat)     || 0,
      sodium:  parseFloat(fields.sodium)  || 0,
      sugar:   parseFloat(fields.sugar)   || 0,
      ...(baseNutrients && !isNaN(g) ? { grams: g } : {}),
    });
    clearForm();
  }

  function addToRecipe() {
    if (!fields.name.trim()) return;
    const g = parseFloat(grams);
    setRecipeIngredients(prev => [...prev, {
      name:    fields.name.trim(),
      cal:     parseFloat(fields.cal)     || 0,
      protein: parseFloat(fields.protein) || 0,
      carbs:   parseFloat(fields.carbs)   || 0,
      fat:     parseFloat(fields.fat)     || 0,
      sodium:  parseFloat(fields.sodium)  || 0,
      sugar:   parseFloat(fields.sugar)   || 0,
      ...(baseNutrients && !isNaN(g) ? { grams: g } : {}),
    }]);
    clearForm();
  }

  function removeIngredient(i) {
    setRecipeIngredients(prev => prev.filter((_, idx) => idx !== i));
  }

  function finishRecipe() {
    if (!recipeName.trim() || recipeIngredients.length === 0) return;
    onAdd({
      name: recipeName.trim(),
      ...sumIngredients(recipeIngredients),
      recipe: true,
      ingredients: recipeIngredients,
    });
    setRecipeMode(false);
    setRecipeName('');
    setRecipeIngredients([]);
    clearForm();
  }

  function cancelRecipe() {
    setRecipeMode(false);
    setRecipeName('');
    setRecipeIngredients([]);
    clearForm();
  }

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{recipeMode ? 'Add Recipe' : 'Add Food'}</h2>
        <button
          type="button"
          className={recipeMode ? styles.recipeModeActiveBtn : styles.recipeModeBtn}
          onClick={() => recipeMode ? cancelRecipe() : setRecipeMode(true)}
        >
          {recipeMode ? 'Cancel Recipe' : 'Make Recipe'}
        </button>
      </div>

      {recipeMode && (
        <div className={styles.recipeHeader}>
          <input
            className={styles.recipeNameInput}
            value={recipeName}
            onChange={e => setRecipeName(e.target.value)}
            placeholder="Recipe name…"
          />
        </div>
      )}

      {!recipeMode && (
        <div className={styles.quickFoods}>
          {QUICK_FOODS.map(food => (
            <button
              key={food.name}
              type="button"
              className={styles.chip}
              onClick={() => fillQuick(food)}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
        <div className={`${styles.field} ${styles.fieldName}`}>
          <label>Food Name</label>
          <input
            value={fields.name}
            onChange={e => handleNameChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="e.g. Chicken breast"
            required
          />
          {showDrop && suggestions.length > 0 && (
            <ul className={styles.dropdown}>
              {suggestions.map(food => (
                <li key={food.fdcId} onMouseDown={() => selectSuggestion(food)} className={styles.dropdownItem}>
                  <span className={styles.dropdownName}>{food.description}</span>
                  {food.brandOwner && <span className={styles.dropdownBrand}>{food.brandOwner}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.field}>
          <label>Grams</label>
          <input
            type="number" min="0" step="1"
            value={grams}
            onChange={e => handleGramsChange(e.target.value)}
            placeholder="g"
            disabled={!baseNutrients}
            className={!baseNutrients ? styles.inputDisabled : ''}
          />
        </div>
        {[
          { key: 'cal',     label: 'Calories', placeholder: 'kcal' },
          { key: 'protein', label: 'Protein',  placeholder: 'g'    },
          { key: 'carbs',   label: 'Carbs',    placeholder: 'g'    },
          { key: 'fat',     label: 'Fat',      placeholder: 'g'    },
          { key: 'sodium',  label: 'Sodium',   placeholder: 'mg'   },
          { key: 'sugar',   label: 'Sugar',    placeholder: 'g'    },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className={styles.field}>
            <label>{label}</label>
            <input
              type="number" min="0" step="0.1"
              value={fields[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
        <div className={styles.btnGroup}>
          <button type="submit" className={styles.submitBtn}>
            {recipeMode ? 'Add Ingredient' : 'Add'}
          </button>
          <button type="button" className={styles.clearBtn} onClick={clearForm}>Clear</button>
        </div>
      </form>

      {recipeMode && recipeIngredients.length > 0 && (
        <div className={styles.ingredientList}>
          <div className={styles.ingredientRow}>
            <span className={styles.ingredientName}>Ingredients ({recipeIngredients.length})</span>
            <span className={styles.iCal}>kcal</span>
            <span className={styles.iProtein}>protein</span>
            <span className={styles.iCarbs}>carbs</span>
            <span className={styles.iFat}>fat</span>
            <span className={styles.iSodium}>sodium</span>
            <span className={styles.iSugar}>sugar</span>
            <span />
          </div>
          {recipeIngredients.map((ing, i) => (
            <div key={i} className={styles.ingredientRow}>
              <span className={styles.ingredientName}>{ing.name}{ing.grams != null ? ` · ${ing.grams}g` : ''}</span>
              <span className={styles.iCal}>{Math.round(ing.cal)}</span>
              <span className={styles.iProtein}>{ing.protein}g</span>
              <span className={styles.iCarbs}>{ing.carbs}g</span>
              <span className={styles.iFat}>{ing.fat}g</span>
              <span className={styles.iSodium}>{Math.round(ing.sodium)}mg</span>
              <span className={styles.iSugar}>{ing.sugar}g</span>
              <button type="button" className={styles.ingredientRemove} onClick={() => removeIngredient(i)}>&#x2715;</button>
            </div>
          ))}
          {(() => { const t = sumIngredients(recipeIngredients); return (
            <div className={`${styles.ingredientRow} ${styles.ingredientTotal}`}>
              <span className={styles.ingredientName}>Total</span>
              <span className={styles.iCal}>{Math.round(t.cal)}</span>
              <span className={styles.iProtein}>{t.protein}g</span>
              <span className={styles.iCarbs}>{t.carbs}g</span>
              <span className={styles.iFat}>{t.fat}g</span>
              <span className={styles.iSodium}>{Math.round(t.sodium)}mg</span>
              <span className={styles.iSugar}>{t.sugar}g</span>
              <span />
            </div>
          ); })()}
          <button
            type="button"
            className={styles.logRecipeBtn}
            disabled={!recipeName.trim()}
            onClick={finishRecipe}
          >
            Log Recipe
          </button>
        </div>
      )}
    </section>
  );
}
