import { Request, Response, NextFunction } from 'express';
import { createAllocationSchema, returnAllocationSchema } from './validation';
import * as service from './service';

export const createAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createAllocationSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const result = await service.allocateAsset(dto, userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const returnAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = returnAllocationSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const result = await service.returnAsset(id, dto, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const triggerOverdueCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const result = await service.flagOverdueAllocations(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
