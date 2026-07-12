import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { errorHandler, AppError } from './middleware/errorHandler';
import { z } from 'zod';
import authRouter from './modules/auth/routes';
import departmentRouter from './modules/departments/routes';
import categoryRouter from './modules/categories/routes';
import userRouter from './modules/users/routes';
import assetRouter from './modules/assets/routes';
import allocationRouter from './modules/allocations/routes';
import transferRouter from './modules/transfers/routes';
import bookingRouter from './modules/bookings/routes';
import maintenanceRouter from './modules/maintenance/routes';
import auditRouter from './modules/audits/routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes mount
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/assets', assetRouter);
app.use('/api/v1/allocations', allocationRouter);
app.use('/api/v1/transfers', transferRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/audits', auditRouter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test error handling endpoint
app.get('/api/test-error', (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type;

    if (type === 'custom') {
      throw new AppError(409, 'ALLOCATION_CONFLICT', 'Asset is currently held by Priya Shah.', {
        holderId: 1
      });
    }

    if (type === 'zod') {
      // Validate schema that will fail
      const testSchema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      testSchema.parse({ email: 'invalid-email', age: 10 });
    }

    if (type === 'internal') {
      throw new Error('A severe unexpected runtime error.');
    }

    res.json({ message: 'No error triggered. Pass ?type=custom, ?type=zod, or ?type=internal.' });
  } catch (err) {
    next(err);
  }
});

// Apply custom centralized error handler middleware
app.use(errorHandler);

import { flagOverdueAllocations } from './modules/allocations/service';
import { sendBookingReminders } from './modules/bookings/service';

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);

  // Setup background overdue scanner (runs every 5 minutes)
  setInterval(async () => {
    try {
      const result = await flagOverdueAllocations();
      if (result.count > 0) {
        console.log(`[CRON] Auto-flagged ${result.count} overdue allocations.`);
      }
    } catch (err) {
      console.error('[CRON Error] Failed to scan overdue allocations:', err);
    }
  }, 1000 * 60 * 5);

  // Setup background booking reminders scanner (runs every 5 minutes)
  setInterval(async () => {
    try {
      const result = await sendBookingReminders();
      if (result.count > 0) {
        console.log(`[CRON] Dispatched ${result.count} upcoming booking reminders.`);
      }
    } catch (err) {
      console.error('[CRON Error] Failed to scan booking reminders:', err);
    }
  }, 1000 * 60 * 5);
});
