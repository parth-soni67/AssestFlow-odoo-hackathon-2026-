import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
    const action = req.query.action as string || undefined;
    const entityType = req.query.entityType as string || undefined;
    const search = req.query.search as string || undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);

    const result = await service.listActivityLogs({
      userId,
      action,
      entityType,
      search,
      page,
      limit
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
