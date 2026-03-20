import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

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
