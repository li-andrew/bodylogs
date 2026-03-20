import db from '../../config/db.js';

// ── Food Items ──────────────────────────────────────

export async function getItems(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM food_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch food items' });
  }
}

export async function createItem(req, res) {
  try {
    const { name, calories, protein, carbs, fat, sodium, sugar, grams } = req.body;
    const result = await db.query(
      `INSERT INTO food_items (user_id, name, calories, protein, carbs, fat, sodium, sugar, grams)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.userId, name, calories, protein, carbs, fat, sodium, sugar, grams]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create food item' });
  }
}

export async function updateItem(req, res) {
  try {
    const { name, calories, protein, carbs, fat, sodium, sugar, grams } = req.body;
    const result = await db.query(
      `UPDATE food_items
       SET name=$1, calories=$2, protein=$3, carbs=$4, fat=$5, sodium=$6, sugar=$7, grams=$8
       WHERE id=$9 AND user_id=$10
       RETURNING *`,
      [name, calories, protein, carbs, fat, sodium, sugar, grams, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update food item' });
  }
}

export async function deleteItem(req, res) {
  try {
    const result = await db.query(
      'DELETE FROM food_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete food item' });
  }
}

// ── Food Logs ───────────────────────────────────────

export async function getLogs(req, res) {
  try {
    const { date } = req.query;
    const result = await db.query(
      `SELECT fl.id, fl.servings, fl.logged_at, fl.food_item_id,
              fi.name, fi.calories, fi.protein, fi.carbs, fi.fat,
              fi.sodium, fi.sugar, fi.grams
       FROM food_logs fl
       JOIN food_items fi ON fl.food_item_id = fi.id
       WHERE fl.user_id = $1 AND fl.logged_at = $2
       ORDER BY fl.created_at`,
      [req.userId, date]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch food logs' });
  }
}

export async function createLog(req, res) {
  try {
    const { food_item_id, servings, logged_at } = req.body;
    const result = await db.query(
      `INSERT INTO food_logs (user_id, food_item_id, servings, logged_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, food_item_id, servings || 1, logged_at]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create food log' });
  }
}

export async function updateLog(req, res) {
  try {
    const { servings } = req.body;
    const result = await db.query(
      `UPDATE food_logs SET servings = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [servings, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update food log' });
  }
}

export async function deleteLog(req, res) {
  try {
    const result = await db.query(
      'DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete food log' });
  }
}

// ── Recipes ─────────────────────────────────────────

export async function getRecipes(req, res) {
  try {
    const result = await db.query(
      `SELECT r.id, r.name, r.created_at,
              json_agg(json_build_object(
                'id', ri.id,
                'food_item_id', ri.food_item_id,
                'servings', ri.servings,
                'name', fi.name,
                'calories', fi.calories,
                'protein', fi.protein,
                'carbs', fi.carbs,
                'fat', fi.fat,
                'sodium', fi.sodium,
                'sugar', fi.sugar,
                'grams', fi.grams
              )) AS items
       FROM recipes r
       LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
       LEFT JOIN food_items fi ON ri.food_item_id = fi.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

export async function getRecipe(req, res) {
  try {
    const result = await db.query(
      `SELECT r.id, r.name, r.created_at,
              json_agg(json_build_object(
                'id', ri.id,
                'food_item_id', ri.food_item_id,
                'servings', ri.servings,
                'name', fi.name,
                'calories', fi.calories,
                'protein', fi.protein,
                'carbs', fi.carbs,
                'fat', fi.fat
              )) AS items
       FROM recipes r
       LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
       LEFT JOIN food_items fi ON ri.food_item_id = fi.id
       WHERE r.id = $1 AND r.user_id = $2
       GROUP BY r.id`,
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
}

export async function createRecipe(req, res) {
  const client = await db.connect();
  try {
    const { name, items } = req.body;
    await client.query('BEGIN');

    const recipe = await client.query(
      'INSERT INTO recipes (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.userId, name]
    );

    for (const item of items) {
      await client.query(
        'INSERT INTO recipe_items (recipe_id, food_item_id, servings) VALUES ($1, $2, $3)',
        [recipe.rows[0].id, item.food_item_id, item.servings || 1]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(recipe.rows[0]);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create recipe' });
  } finally {
    client.release();
  }
}

export async function updateRecipe(req, res) {
  const client = await db.connect();
  try {
    const { name, items } = req.body;
    await client.query('BEGIN');

    const recipe = await client.query(
      'UPDATE recipes SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name, req.params.id, req.userId]
    );
    if (!recipe.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    // Replace all items
    await client.query('DELETE FROM recipe_items WHERE recipe_id = $1', [req.params.id]);
    for (const item of items) {
      await client.query(
        'INSERT INTO recipe_items (recipe_id, food_item_id, servings) VALUES ($1, $2, $3)',
        [req.params.id, item.food_item_id, item.servings || 1]
      );
    }

    await client.query('COMMIT');
    res.json(recipe.rows[0]);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update recipe' });
  } finally {
    client.release();
  }
}

export async function deleteRecipe(req, res) {
  try {
    const result = await db.query(
      'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}

export async function logRecipe(req, res) {
  const client = await db.connect();
  try {
    const { logged_at } = req.body;
    await client.query('BEGIN');

    // Get all items in the recipe
    const items = await client.query(
      'SELECT food_item_id, servings FROM recipe_items WHERE recipe_id = $1',
      [req.params.id]
    );

    // Create a food_log entry for each item
    const logs = [];
    for (const item of items.rows) {
      const result = await client.query(
        `INSERT INTO food_logs (user_id, food_item_id, servings, logged_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.userId, item.food_item_id, item.servings, logged_at]
      );
      logs.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(logs);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to log recipe' });
  } finally {
    client.release();
  }
}

// ── Weight Logs ─────────────────────────────────────

export async function getWeightLogs(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY logged_at',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch weight logs' });
  }
}

export async function logWeight(req, res) {
  try {
    const { weight, logged_at } = req.body;
    const result = await db.query(
      `INSERT INTO weight_logs (user_id, weight, logged_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, logged_at)
       DO UPDATE SET weight = $2
       RETURNING *`,
      [req.userId, weight, logged_at]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to log weight' });
  }
}

// ── Goals ───────────────────────────────────────────

export async function getGoals(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM goals WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
}

export async function updateGoals(req, res) {
  try {
    const { calories, protein, carbs, fat, weight } = req.body;
    const result = await db.query(
      `INSERT INTO goals (user_id, calories, protein, carbs, fat, weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET calories=$2, protein=$3, carbs=$4, fat=$5, weight=$6, updated_at=now()
       RETURNING *`,
      [req.userId, calories, protein, carbs, fat, weight]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update goals' });
  }
}
