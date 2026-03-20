import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

// Workout types (templates)
router.get('/types', controller.getTypes);
router.post('/types', controller.createType);
router.put('/types/:id', controller.updateType);
router.delete('/types/:id', controller.deleteType);

// Workout logs
router.get('/logs', controller.getLogs);
router.post('/logs', controller.toggleLog);

export default router;
