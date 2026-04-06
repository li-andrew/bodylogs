import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

// USDA food search proxy
router.get('/usda/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=7&api_key=${process.env.USDA_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.foods || []);
  } catch (err) {
    console.error('USDA search error:', err.message);
    res.status(500).json({ error: 'USDA search failed' });
  }
});

// Food items (templates)
router.get('/items', controller.getItems);
router.post('/items', controller.createItem);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.deleteItem);

// Food logs
router.get('/logs', controller.getLogs);
router.post('/logs', controller.createLog);
router.put('/logs/:id', controller.updateLog);
router.delete('/logs/:id', controller.deleteLog);

// Recipes
router.get('/recipes', controller.getRecipes);
router.get('/recipes/:id', controller.getRecipe);
router.post('/recipes', controller.createRecipe);
router.put('/recipes/:id', controller.updateRecipe);
router.delete('/recipes/:id', controller.deleteRecipe);
router.post('/recipes/:id/log', controller.logRecipe);

// Weight logs
router.get('/weight', controller.getWeightLogs);
router.post('/weight', controller.logWeight);

// Goals
router.get('/goals', controller.getGoals);
router.put('/goals', controller.updateGoals);

export default router;
