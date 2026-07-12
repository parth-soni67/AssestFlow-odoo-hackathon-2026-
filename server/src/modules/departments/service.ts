import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { UserStatus } from '@prisma/client';
import { CreateDepartmentDto, UpdateDepartmentDto } from './validation';

// Helper to check circular parent relationships in department hierarchies
async function hasCircularDependency(deptId: number, proposedParentId: number): Promise<boolean> {
  if (deptId === proposedParentId) return true;
  let currentParentId: number | null = proposedParentId;

  while (currentParentId) {
    const parentDept: { parentDepartmentId: number | null } | null = await prisma.department.findUnique({
      where: { id: currentParentId },
      select: { parentDepartmentId: true }
    });

    if (!parentDept) break;
    if (parentDept.parentDepartmentId === deptId) return true;
    currentParentId = parentDept.parentDepartmentId;
  }
  return false;
}

export const listDepartments = async (activeOnly?: boolean) => {
  return await prisma.department.findMany({
    where: activeOnly ? { status: UserStatus.Active } : undefined,
    include: {
      parentDepartment: {
        select: { id: true, name: true }
      },
      departmentHead: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: {
          employees: true,
          assets: true,
          subDepartments: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const createDepartment = async (dto: CreateDepartmentDto) => {
  // Validate parent if set
  if (dto.parentDepartmentId) {
    const parentDept = await prisma.department.findUnique({
      where: { id: dto.parentDepartmentId }
    });
    if (!parentDept) {
      throw new AppError(400, 'PARENT_DEPARTMENT_NOT_FOUND', 'Parent department does not exist.');
    }
  }

  // Validate head if set
  if (dto.departmentHeadId) {
    const head = await prisma.user.findUnique({
      where: { id: dto.departmentHeadId }
    });
    if (!head) {
      throw new AppError(400, 'USER_NOT_FOUND', 'Department head user does not exist.');
    }

    const existingHead = await prisma.department.findUnique({
      where: { departmentHeadId: dto.departmentHeadId }
    });
    if (existingHead) {
      throw new AppError(400, 'USER_ALREADY_DEPARTMENT_HEAD', 'User is already assigned as head of another department.');
    }
  }

  return await prisma.department.create({
    data: {
      name: dto.name,
      parentDepartmentId: dto.parentDepartmentId || null,
      departmentHeadId: dto.departmentHeadId || null,
      status: dto.status || UserStatus.Active
    },
    include: {
      parentDepartment: { select: { id: true, name: true } },
      departmentHead: { select: { id: true, name: true, email: true } }
    }
  });
};

export const updateDepartment = async (id: number, dto: UpdateDepartmentDto) => {
  const dept = await prisma.department.findUnique({
    where: { id }
  });

  if (!dept) {
    throw new AppError(404, 'DEPARTMENT_NOT_FOUND', 'Department does not exist.');
  }

  // Validate parent circular check
  if (dto.parentDepartmentId) {
    const parentDept = await prisma.department.findUnique({
      where: { id: dto.parentDepartmentId }
    });
    if (!parentDept) {
      throw new AppError(400, 'PARENT_DEPARTMENT_NOT_FOUND', 'Parent department does not exist.');
    }

    const isCircular = await hasCircularDependency(id, dto.parentDepartmentId);
    if (isCircular) {
      throw new AppError(400, 'CIRCULAR_DEPENDENCY', 'Cannot assign parent department that creates a circular hierarchy.');
    }
  }

  // Validate head
  if (dto.departmentHeadId) {
    const head = await prisma.user.findUnique({
      where: { id: dto.departmentHeadId }
    });
    if (!head) {
      throw new AppError(400, 'USER_NOT_FOUND', 'Department head user does not exist.');
    }

    const existingHead = await prisma.department.findFirst({
      where: {
        departmentHeadId: dto.departmentHeadId,
        NOT: { id }
      }
    });
    if (existingHead) {
      throw new AppError(400, 'USER_ALREADY_DEPARTMENT_HEAD', 'User is already assigned as head of another department.');
    }
  }

  return await prisma.department.update({
    where: { id },
    data: {
      name: dto.name !== undefined ? dto.name : undefined,
      parentDepartmentId: dto.parentDepartmentId !== undefined ? dto.parentDepartmentId : undefined,
      departmentHeadId: dto.departmentHeadId !== undefined ? dto.departmentHeadId : undefined,
      status: dto.status !== undefined ? dto.status : undefined
    },
    include: {
      parentDepartment: { select: { id: true, name: true } },
      departmentHead: { select: { id: true, name: true, email: true } }
    }
  });
};

export const deleteDepartment = async (id: number) => {
  const dept = await prisma.department.findUnique({
    where: { id }
  });

  if (!dept) {
    throw new AppError(404, 'DEPARTMENT_NOT_FOUND', 'Department does not exist.');
  }

  // Check sub-departments
  const subCount = await prisma.department.count({
    where: { parentDepartmentId: id }
  });
  if (subCount > 0) {
    throw new AppError(400, 'SUB_DEPARTMENTS_ASSIGNED', 'Cannot delete department that contains active sub-departments.');
  }

  // Check employees
  const employeeCount = await prisma.user.count({
    where: { departmentId: id }
  });
  if (employeeCount > 0) {
    throw new AppError(400, 'EMPLOYEES_ASSIGNED_TO_DEPARTMENT', 'Cannot delete department that contains assigned employees.');
  }

  // Check assets
  const assetCount = await prisma.asset.count({
    where: { currentDepartmentId: id }
  });
  if (assetCount > 0) {
    throw new AppError(400, 'ASSETS_ASSIGNED_TO_DEPARTMENT', 'Cannot delete department that has assets registered to it.');
  }

  await prisma.department.delete({
    where: { id }
  });
};
