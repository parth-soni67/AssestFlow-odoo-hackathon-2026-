import { Router } from 'express';
import * as controller from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create a new booking - accessible by any authenticated user
router.post('/', authenticate, controller.createBooking);

// Fetch existing bookings for a resource - accessible by any authenticated user
router.get('/', authenticate, controller.listBookings);

// Cancel a booking
router.post('/:id/cancel', authenticate, controller.cancelBooking);

// Reschedule an upcoming booking
router.post('/:id/reschedule', authenticate, controller.rescheduleBooking);

// Trigger slot reminder scans manually - Admin or AssetManager only
router.post('/reminders/trigger', authenticate, requireRole([Role.Admin, Role.AssetManager]), controller.triggerReminders);

export default router;
