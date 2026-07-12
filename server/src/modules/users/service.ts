import { prisma } from '../../lib/prisma';
import { ListUsersQuery, UpdateUserRoleDto } from './validation';
import { Prisma, Role } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

export const listUsers = async (query: ListUsersQuery) => {
  const where: Prisma.UserWhereInput = {};

  if (query.departmentId !== undefined) {
    where.departmentId = query.departmentId;
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      departmentId: true,
      department: {
        select: { id: true, name: true }
      },
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });
};

export const updateUserRole = async (id: number, dto: UpdateUserRoleDto) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User does not exist.');
  }

  // Active Department Head check
  if (user.role === Role.DepartmentHead && dto.role !== Role.DepartmentHead && dto.role !== Role.Admin) {
    const headingDept = await prisma.department.findUnique({
      where: { departmentHeadId: id }
    });
    if (headingDept) {
      throw new AppError(400, 'USER_IS_ACTIVE_DEPARTMENT_HEAD', 'Cannot demote user who is currently assigned as head of a department. Clear the department head assignment first.');
    }
  }

  return await prisma.user.update({
    where: { id },
    data: { role: dto.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      departmentId: true,
      department: {
        select: { id: true, name: true }
      },
      createdAt: true
    }
  });
};
