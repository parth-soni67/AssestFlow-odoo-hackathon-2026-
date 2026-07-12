import { Router } from 'express';
import { signup, login, forgotPassword, resetPasswordController, getMe } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordController);
router.get('/me', authenticate, getMe);

export default router;
