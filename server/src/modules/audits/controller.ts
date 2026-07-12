import { Request, Response, NextFunction } from 'express';
import { createAuditCycleSchema } from './validation';
import { submitAuditItemSchema } from './itemValidation';
import * as service from './service';

export const createCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createAuditCycleSchema.parse(req.body);
    const cycle = await service.createAuditCycle(dto);
    res.status(201).json({ cycle });
  } catch (err) {
    next(err);
  }
};

export const submitItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycleId = parseInt(req.params.cycleId, 10);
    const dto = submitAuditItemSchema.parse(req.body);
    const auditorId = (req as any).user.userId;
    const role = (req as any).user.role;
    const item = await service.submitAuditItem(cycleId, dto, auditorId, role);
    res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
};
