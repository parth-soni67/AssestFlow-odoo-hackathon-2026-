import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Get real-time dashboard aggregates
router.get('/stats', authenticate, controller.getStats);

export default router;
