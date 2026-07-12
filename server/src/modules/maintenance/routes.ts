import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Get maintenance requests list - accessible by any authenticated user
router.get('/', authenticate, controller.getRequests);

// Raise a maintenance request - accessible by any authenticated user
router.post('/', authenticate, controller.createRequest);

// Approve a maintenance request - Admin or AssetManager only
router.post('/:id/approve', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.approveRequest);

// Reject a maintenance request - Admin or AssetManager only
router.post('/:id/reject', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.rejectRequest);

// Resolve a maintenance request - Admin or AssetManager only
router.post('/:id/resolve', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.resolveRequest);

// Assign a technician - Admin or AssetManager only
router.post('/:id/assign', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.assignTechnician);

// Start work on maintenance request - Admin or AssetManager only
router.post('/:id/start', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.startWork);

export default router;
