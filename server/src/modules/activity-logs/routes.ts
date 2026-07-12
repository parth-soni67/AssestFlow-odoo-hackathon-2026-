import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Retrieve activity logs (with pagination & search filters)
router.get('/', authenticate, controller.getActivityLogs);

export default router;
