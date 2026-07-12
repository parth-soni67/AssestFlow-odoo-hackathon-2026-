import { z } from 'zod';

export const customFieldDefSchema = z.object({
  name: z.string().min(1, 'Custom field name is required'),
  type: z.enum(['text', 'number', 'boolean']),
  required: z.boolean(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  customFields: z.array(customFieldDefSchema).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
