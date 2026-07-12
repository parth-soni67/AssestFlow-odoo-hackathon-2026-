import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Retrieve notifications list
router.get('/', authenticate, controller.getNotifications);

// Mark a notification as read
router.post('/:id/read', authenticate, controller.readNotification);

// Mark all user notifications as read
router.post('/read-all', authenticate, controller.readAllNotifications);

export default router;
