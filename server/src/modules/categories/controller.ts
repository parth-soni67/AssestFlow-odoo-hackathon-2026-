import { Request, Response, NextFunction } from 'express';
import { createCategorySchema, updateCategorySchema } from './validation';
import * as service from './service';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await service.listCategories();
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createCategorySchema.parse(req.body);
    const category = await service.createCategory(dto);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = updateCategorySchema.parse(req.body);
    const category = await service.updateCategory(id, dto);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await service.deleteCategory(id);
    res.status(200).json({ success: true, message: 'Asset category successfully deleted.' });
  } catch (err) {
    next(err);
  }
};
