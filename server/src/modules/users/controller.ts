import { Request, Response, NextFunction } from 'express';
import { listUsersQuerySchema, updateUserRoleSchema } from './validation';
import * as service from './service';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    const users = await service.listUsers(query);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto = updateUserRoleSchema.parse(req.body);
    const user = await service.updateUserRole(id, dto);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
