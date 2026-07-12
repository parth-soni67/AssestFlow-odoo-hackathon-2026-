import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Retrieve asset utilization trend report
router.get('/utilization', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getUtilizationReport);

// Retrieve asset maintenance frequency report
router.get('/maintenance', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getMaintenanceReport);

// Retrieve asset maintenance/retirement schedules report
router.get('/maintenance-retirement', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getSchedulesReport);

// Retrieve department-wise asset allocations report
router.get('/department-allocations', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getDepartmentAllocationsReport);

// Retrieve booking scheduling heatmap report
router.get('/booking-heatmap', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.getBookingHeatmapReport);

export default router;
