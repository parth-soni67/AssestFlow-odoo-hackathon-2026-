import { z } from 'zod';

export const createBookingSchema = z.object({
  resourceAssetId: z.number().int().positive('Resource Asset ID is required'),
  startTime: z.coerce.date({ invalid_type_error: 'Start time must be a valid date' }),
  endTime: z.coerce.date({ invalid_type_error: 'End time must be a valid date' }),
}).refine(data => data.startTime.getTime() < data.endTime.getTime(), {
  message: "Start time must be before end time",
  path: ['endTime']
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const listBookingsSchema = z.object({
  resourceAssetId: z.coerce.number().int().positive('Resource Asset ID is required'),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
});

export type ListBookingsDto = z.infer<typeof listBookingsSchema>;

export const rescheduleBookingSchema = z.object({
  startTime: z.coerce.date({ invalid_type_error: 'Start time must be a valid date' }),
  endTime: z.coerce.date({ invalid_type_error: 'End time must be a valid date' }),
}).refine(data => data.startTime.getTime() < data.endTime.getTime(), {
  message: "Start time must be before end time",
  path: ['endTime']
});

export type RescheduleBookingDto = z.infer<typeof rescheduleBookingSchema>;
