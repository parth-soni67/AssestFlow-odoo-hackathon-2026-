import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createMaintenanceRequestSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  issueDescription: z.string().trim().min(5, 'Issue description must be at least 5 characters long'),
  priority: z.nativeEnum(Priority, { required_error: 'Priority is required' }),
  photo: z.string().trim().url('Photo must be a valid URL').optional().nullable(),
});

export type CreateMaintenanceRequestDto = z.infer<typeof createMaintenanceRequestSchema>;

export const assignTechnicianSchema = z.object({
  technicianName: z.string().trim().min(2, 'Technician name must be at least 2 characters long')
});

export type AssignTechnicianDto = z.infer<typeof assignTechnicianSchema>;
