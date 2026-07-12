import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.number().int().positive('Category is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  qrCode: z.string().nullable().optional(),
  acquisitionDate: z.coerce.date(),
  acquisitionCost: z.coerce.number().positive('Cost must be positive'),
  condition: z.string().min(2, 'Condition is required'),
  location: z.string().min(2, 'Location is required'),
  photosDocs: z.any().optional(),
  isBookable: z.boolean().optional(),
});

export type CreateAssetDto = z.infer<typeof createAssetSchema>;

import { AssetStatus } from '@prisma/client';

export const listAssetsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : undefined),
    z.number().int().positive().optional()
  ),
  departmentId: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : undefined),
    z.number().int().positive().optional()
  ),
  status: z.nativeEnum(AssetStatus).optional(),
  isBookable: z.preprocess(
    (val) => (val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined),
    z.boolean().optional()
  ),
});

export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
