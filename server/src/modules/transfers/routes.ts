import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Request a transfer - accessible by any authenticated user
router.post('/', authenticate, controller.createTransfer);

// Approve or Reject a transfer request - Admin or AssetManager only
router.put('/:id', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.updateTransfer);

export default router;
