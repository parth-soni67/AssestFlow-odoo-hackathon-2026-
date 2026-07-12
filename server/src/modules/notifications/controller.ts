import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await service.listNotifications(userId);
    res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
};

export const readNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const id = parseInt(req.params.id, 10);
    const notification = await service.markAsRead(id, userId);
    res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
};

export const readAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const result = await service.markAllAsRead(userId);
    res.status(200).json({ count: result.count });
  } catch (err) {
    next(err);
  }
};
