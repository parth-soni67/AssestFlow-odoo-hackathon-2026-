import { z } from 'zod';

export const createAuditCycleSchema = z.object({
  name: z.string().trim().min(3, 'Audit cycle name must be at least 3 characters long'),
  scopeDepartmentId: z.number().int().positive().optional().nullable(),
  location: z.string().trim().min(1, 'Location cannot be empty').optional().nullable(),
  dateRangeStart: z.string().datetime({ message: 'Start date must be a valid ISO string' }),
  dateRangeEnd: z.string().datetime({ message: 'End date must be a valid ISO string' }),
  assignedAuditors: z.array(z.number().int().positive()).min(1, 'At least one auditor must be assigned')
}).refine(
  (data) => new Date(data.dateRangeEnd) >= new Date(data.dateRangeStart),
  {
    message: 'End date must be greater than or equal to start date',
    path: ['dateRangeEnd']
  }
);

export type CreateAuditCycleDto = z.infer<typeof createAuditCycleSchema>;
