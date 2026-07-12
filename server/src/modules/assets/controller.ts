import { Request, Response, NextFunction } from 'express';
import { createAssetSchema, listAssetsQuerySchema } from './validation';
import * as service from './service';

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createAssetSchema.parse(req.body);
    const asset = await service.registerAsset(dto);
    res.status(201).json({ asset });
  } catch (err) {
    next(err);
  }
};

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listAssetsQuerySchema.parse(req.query);
    const assets = await service.listAssets(query);
    res.status(200).json({ assets });
  } catch (err) {
    next(err);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const asset = await service.fetchAssetById(id);
    res.status(200).json({ asset });
  } catch (err) {
    next(err);
  }
};
