import { Request, Response, NextFunction } from 'express';
import { createAllocationSchema } from './validation';
import * as service from './service';

export const createAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createAllocationSchema.parse(req.body);
    const result = await service.allocateAsset(dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
