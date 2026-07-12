import { z } from 'zod';

export const createAllocationSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  employeeId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  expectedReturnDate: z.coerce.date(),
}).refine(data => {
  const hasEmp = data.employeeId !== undefined && data.employeeId !== null;
  const hasDept = data.departmentId !== undefined && data.departmentId !== null;
  return hasEmp || hasDept;
}, {
  message: "Either employeeId or departmentId must be specified",
  path: ['employeeId']
});

export type CreateAllocationDto = z.infer<typeof createAllocationSchema>;

export const returnAllocationSchema = z.object({
  returnConditionNotes: z.string().trim().max(1000).optional().nullable(),
  condition: z.string().trim().optional().nullable(),
});

export type ReturnAllocationDto = z.infer<typeof returnAllocationSchema>;
