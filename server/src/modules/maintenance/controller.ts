import { Request, Response, NextFunction } from 'express';
import { createMaintenanceRequestSchema, assignTechnicianSchema } from './validation';
import * as service from './service';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createMaintenanceRequestSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const request = await service.raiseMaintenanceRequest(dto, userId);
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user.userId;
    const result = await service.approveRequest(id, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user.userId;
    const result = await service.rejectRequest(id, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const resolveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user.userId;
    const result = await service.resolveRequest(id, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const assignTechnician = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = assignTechnicianSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const result = await service.assignTechnician(id, dto, userId);
    res.status(200).json({ request: result });
  } catch (err) {
    next(err);
  }
};

export const startWork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user.userId;
    const result = await service.startWork(id, userId);
    res.status(200).json({ request: result });
  } catch (err) {
    next(err);
  }
};
