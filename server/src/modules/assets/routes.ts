import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Register a new asset - accessible only by Admin or AssetManager
router.post('/', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.createAsset);

// View all assets - accessible by any authenticated user
router.get('/', authenticate, controller.getAssets);

// View asset details - accessible by any authenticated user
router.get('/:id', authenticate, controller.getAssetById);

export default router;
