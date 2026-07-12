import { Request, Response, NextFunction } from 'express';
import { createDepartmentSchema, updateDepartmentSchema } from './validation';
import * as service from './service';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const departments = await service.listDepartments(activeOnly);
    res.status(200).json({ departments });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createDepartmentSchema.parse(req.body);
    const department = await service.createDepartment(dto);
    res.status(201).json({ department });
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = updateDepartmentSchema.parse(req.body);
    const department = await service.updateDepartment(id, dto);
    res.status(200).json({ department });
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await service.deleteDepartment(id);
    res.status(200).json({ success: true, message: 'Department successfully deleted.' });
  } catch (err) {
    next(err);
  }
};
