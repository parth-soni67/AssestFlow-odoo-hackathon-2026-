import { Request, Response, NextFunction } from 'express';
import { createTransferSchema, updateTransferSchema } from './validation';
import * as service from './service';

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createTransferSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const transfer = await service.requestTransfer(dto, userId);
    res.status(201).json({ transfer });
  } catch (err) {
    next(err);
  }
};

export const updateTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = updateTransferSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const transfer = await service.processTransfer(id, dto, userId);
    res.status(200).json({ transfer });
  } catch (err) {
    next(err);
  }
};
