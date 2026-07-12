import { Request, Response, NextFunction } from 'express';
import { createAllocationSchema, returnAllocationSchema } from './validation';
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

export const returnAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = returnAllocationSchema.parse(req.body);
    const result = await service.returnAsset(id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const triggerOverdueCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.flagOverdueAllocations();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
