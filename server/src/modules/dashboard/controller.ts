import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await service.getDashboardStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};
