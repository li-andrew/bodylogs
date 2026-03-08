import { useState, useRef } from 'react';
import { QUICK_FOODS } from '../../data/quickFoods';
import styles from './AddFoodForm.module.css';

const EMPTY = { name: '', cal: '', protein: '', carbs: '', fat: '', sodium: '', sugar: '' };
const EMPTY_CACHE = { cal: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, grams: 0 };

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
  const [cache, setCache] = useState(EMPTY_CACHE);
  function updateCache(valOrFn, label = 'update') {
    setCache(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      console.log(`[cache:${label}]`, next);
      return next;
    });
  }
  const [linked, setLinked] = useState(false);
  const [recipeMode, setRecipeMode] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const debounceRef = useRef(null);

  // Link is only usable once at least one macro has a non-zero reference value
  const canLink = MACRO_KEYS.some(k => cache[k] > 0);

  function fillQuick(food) {
    setBaseNutrients(null);
    setGrams(food.grams != null ? String(food.grams) : '');
    const newCache = {
      cal:     food.cal     || 0,
      protein: food.protein || 0,
      carbs:   food.carbs   || 0,
      fat:     food.fat     || 0,
      sodium:  food.sodium  ?? 0,
      sugar:   food.sugar   ?? 0,
      grams:   food.grams   ?? 0,
    };
    updateCache(newCache, 'quick-food');
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
    setFields(prev => ({ ...prev, name: value }));
    setBaseNutrients(null);
    setGrams('');
    updateCache(EMPTY_CACHE, 'name-change-reset');
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
    // Cache = per-100g nutrient values from API
    updateCache({
      cal:     nutrients.cal     ?? 0,
      protein: nutrients.protein ?? 0,
      carbs:   nutrients.carbs   ?? 0,
      fat:     nutrients.fat     ?? 0,
      sodium:  nutrients.sodium  ?? 0,
      sugar:   nutrients.sugar   ?? 0,
      grams:   100,
    }, 'usda-select');
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
    const g = parseFloat(value);
    if (isNaN(g) || g < 0) return;

    if (baseNutrients) {
      const r = g / 100;
      const scaled = {};
      MACRO_KEYS.forEach(k => {
        if (baseNutrients[k] != null) scaled[k] = Math.round(baseNutrients[k] * r * 10) / 10;
      });
      setFields(prev => ({ ...prev, ...scaled }));
      if (!linked) updateCache(prev => ({ ...prev, ...scaled, grams: g }), 'grams-scale');
      return;
    }

    if (linked && cache.grams > 0) {
      // Manual food, linked: scale all macros from cache using grams ratio
      const ratio = g / cache.grams;
      setFields(prev => {
        const next = { ...prev };
        MACRO_KEYS.forEach(k => { next[k] = Math.round(cache[k] * ratio * 10) / 10; });
        return next;
      });
      return;
    }

    // Manual, unlinked: just track grams in cache
    if (!linked) updateCache(prev => ({ ...prev, grams: g }), 'grams');
  }

  function handleMacroChange(key, value) {
    const numVal = parseFloat(value);

    if (!linked) {
      // Unlinked: update field and keep cache in sync
      setFields(prev => ({ ...prev, [key]: value }));
      if (!isNaN(numVal) && numVal >= 0) {
        updateCache(prev => ({ ...prev, [key]: numVal }), `field:${key}`);
      }
      return;
    }

    // Linked: scale every other macro proportionally from cache
    const cacheVal = cache[key];
    if (isNaN(numVal) || numVal <= 0 || cacheVal <= 0) {
      // No valid ratio — only update this field
      setFields(prev => ({ ...prev, [key]: value }));
      return;
    }

    const ratio = numVal / cacheVal;
    setFields(prev => {
      const next = { ...prev, [key]: value };
      MACRO_KEYS.forEach(k => {
        if (k !== key) next[k] = Math.round(cache[k] * ratio * 10) / 10;
      });
      return next;
    });
    if (cache.grams > 0) setGrams(String(Math.round(cache.grams * ratio * 10) / 10));
  }

  function toggleLinked() {
    if (linked) {
      // Turning off: sync cache to current displayed values so the next
      // unlinked edits start from wherever the user left off
      const synced = {};
      MACRO_KEYS.forEach(k => {
        const v = parseFloat(fields[k]);
        synced[k] = isNaN(v) ? cache[k] : v;
      });
      const g = parseFloat(grams);
      synced.grams = isNaN(g) ? cache.grams : g;
      updateCache(synced, 'unlink-sync');
    }
    setLinked(l => !l);
  }

  function clearForm() {
    setFields(EMPTY);
    setBaseNutrients(null);
    setGrams('');
    updateCache(EMPTY_CACHE, 'clear');
    setLinked(false);
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
      ...(!isNaN(g) && g > 0 ? { grams: g } : {}),
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
      ...(!isNaN(g) && g > 0 ? { grams: g } : {}),
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
        <div className={styles.headingActions}>
          <span title={!canLink ? 'Enter at least one macro value to enable proportional scaling' : undefined}>
            <button
              type="button"
              className={linked ? styles.linkBtnActive : styles.linkBtn}
              onClick={toggleLinked}
              disabled={!canLink}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              {linked ? 'Linked' : 'Link'}
            </button>
          </span>
          <button
            type="button"
            className={recipeMode ? styles.recipeModeActiveBtn : styles.recipeModeBtn}
            onClick={() => recipeMode ? cancelRecipe() : setRecipeMode(true)}
          >
            {recipeMode ? 'Cancel Recipe' : 'Make Recipe'}
          </button>
        </div>
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
            type="number" min="0" step="any"
            value={grams}
            onChange={e => handleGramsChange(e.target.value)}
            placeholder="g"
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
              onChange={e => handleMacroChange(key, e.target.value)}
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
