import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { AppError } from './errorHandler';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: Role;
    departmentId: number | null;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        userId: number;
        role: Role;
        departmentId: number | null;
      };

      req.user = {
        userId: payload.userId,
        role: payload.role,
        departmentId: payload.departmentId,
      };

      next();
    } catch (err) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is invalid or has expired.');
    }
  } catch (err) {
    next(err);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied. Insufficient permissions.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
