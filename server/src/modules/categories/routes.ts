import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Retrieve all categories - accessible by any authenticated user
router.get('/', authenticate, controller.getCategories);

// Create, update, delete categories - Admin only
router.post('/', authenticate, requireRole([Role.Admin]), controller.createCategory);
router.put('/:id', authenticate, requireRole([Role.Admin]), controller.updateCategory);
router.delete('/:id', authenticate, requireRole([Role.Admin]), controller.deleteCategory);

export default router;
