import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create a new audit cycle - Admin or AssetManager only
router.post('/', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.createCycle);

// Submit/update an audit item in a cycle - Gated to assigned auditors or Admin/AssetManager
router.post('/:cycleId/items', authenticate, controller.submitItem);

export default router;
