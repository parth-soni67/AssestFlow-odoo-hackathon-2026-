import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : undefined),
    z.number().int().positive().optional()
  ),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
