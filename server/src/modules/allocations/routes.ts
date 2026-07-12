import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create a new allocation - accessible only by Admin or AssetManager
router.post('/', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.createAllocation);

// Return/Check-in an allocation - accessible only by Admin or AssetManager
router.post('/:id/return', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.returnAllocation);

// Manual check and flag overdue allocations - Admin or AssetManager only
router.post('/overdue/check', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.triggerOverdueCheck);

export default router;
