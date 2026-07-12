import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Retrieve all departments - accessible by any authenticated user
router.get('/', authenticate, controller.getDepartments);

// Create, update, delete departments - Admin only
router.post('/', authenticate, requireRole([Role.Admin]), controller.createDepartment);
router.put('/:id', authenticate, requireRole([Role.Admin]), controller.updateDepartment);
router.delete('/:id', authenticate, requireRole([Role.Admin]), controller.deleteDepartment);

export default router;
