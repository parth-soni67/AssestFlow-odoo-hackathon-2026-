import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Retrieve all users - accessible by any authenticated user
router.get('/', authenticate, controller.getUsers);

// Update user role - Admin only
router.put('/:id/role', authenticate, requireRole([Role.Admin]), controller.updateUserRole);

export default router;
