import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  parentDepartmentId: z.number().int().positive().nullable().optional(),
  departmentHeadId: z.number().int().positive().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();
export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
