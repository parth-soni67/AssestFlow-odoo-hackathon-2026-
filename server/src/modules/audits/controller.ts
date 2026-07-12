import { Request, Response, NextFunction } from 'express';
import { createAuditCycleSchema } from './validation';
import { submitAuditItemSchema } from './itemValidation';
import * as service from './service';

export const createCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createAuditCycleSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const cycle = await service.createAuditCycle(dto, userId);
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

export const getDiscrepancies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycleId = parseInt(req.params.cycleId, 10);
    const report = await service.generateDiscrepancyReport(cycleId);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const closeCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycleId = parseInt(req.params.cycleId, 10);
    const userId = (req as any).user.userId;
    const cycle = await service.closeAuditCycle(cycleId, userId);
    res.status(200).json({ cycle });
  } catch (err) {
    next(err);
  }
};
