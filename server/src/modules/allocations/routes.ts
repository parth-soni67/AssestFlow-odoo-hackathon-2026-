import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create a new allocation - accessible only by Admin or AssetManager
router.post('/', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.createAllocation);

export default router;
