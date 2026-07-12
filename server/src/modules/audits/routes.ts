import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create a new audit cycle - Admin or AssetManager only
router.post('/', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.createCycle);

// Submit/update an audit item in a cycle - Gated to assigned auditors or Admin/AssetManager
router.post('/:cycleId/items', authenticate, controller.submitItem);

// Get discrepancy report for a cycle - Admin or AssetManager only
router.get('/:cycleId/discrepancies', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getDiscrepancies);

// Close an audit cycle and transition missing assets to Lost - Admin or AssetManager only
router.post('/:cycleId/close', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.closeCycle);

export default router;
