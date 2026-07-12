import { z } from 'zod';
import { AuditResult } from '@prisma/client';

export const submitAuditItemSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  result: z.nativeEnum(AuditResult, { required_error: 'Result is required' }),
  notes: z.string().trim().optional().nullable(),
});

export type SubmitAuditItemDto = z.infer<typeof submitAuditItemSchema>;
