import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export const getUtilizationReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await service.getAssetUtilizationReport();
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const getMaintenanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await service.getAssetMaintenanceReport();
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const getSchedulesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await service.getAssetSchedulesReport();
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const getDepartmentAllocationsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await service.getDepartmentAllocationsReport();
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const getBookingHeatmapReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await service.getBookingHeatmapReport();
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};
