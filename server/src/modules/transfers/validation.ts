import { z } from 'zod';

export const createTransferSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  toHolderId: z.number().int().positive('Recipient User ID is required'),
});

export const updateTransferSchema = z.object({
  action: z.enum(['Approve', 'Reject'], {
    errorMap: () => ({ message: "Action must be either 'Approve' or 'Reject'" }),
  }),
});

export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type UpdateTransferDto = z.infer<typeof updateTransferSchema>;
