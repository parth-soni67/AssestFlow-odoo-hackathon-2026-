import { Request, Response, NextFunction } from 'express';
import { createBookingSchema, listBookingsSchema, rescheduleBookingSchema } from './validation';
import * as service from './service';

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createBookingSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const booking = await service.createBooking(dto, userId);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
};

export const listBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = listBookingsSchema.parse(req.query);
    const result = await service.listBookings(dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const result = await service.cancelBooking(id, userId, role);
    res.status(200).json({ booking: result });
  } catch (err) {
    next(err);
  }
};

export const rescheduleBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = rescheduleBookingSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const result = await service.rescheduleBooking(id, dto, userId, role);
    res.status(200).json({ booking: result });
  } catch (err) {
    next(err);
  }
};

export const triggerReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.sendBookingReminders();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
