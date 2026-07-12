import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateAllocationDto } from './validation';
import { AssetStatus, AllocationStatus } from '@prisma/client';

export const allocateAsset = async (dto: CreateAllocationDto) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch asset with current assignee info
    const asset = await tx.asset.findUnique({
      where: { id: dto.assetId },
      include: {
        currentHolder: { select: { id: true, name: true, email: true } },
        currentDepartment: { select: { id: true, name: true } }
      }
    });

    if (!asset) {
      throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
    }

    // 2. Check if asset is available
    if (asset.status !== AssetStatus.Available) {
      if (asset.status === AssetStatus.Allocated) {
        let holderStr = 'another assignee';
        if (asset.currentHolder) {
          holderStr = `${asset.currentHolder.name} (${asset.currentHolder.email})`;
        } else if (asset.currentDepartment) {
          holderStr = `department ${asset.currentDepartment.name}`;
        }
        throw new AppError(400, 'ASSET_ALREADY_ALLOCATED', `Asset is currently held by ${holderStr}.`, {
          currentHolder: asset.currentHolder || null,
          currentDepartment: asset.currentDepartment || null
        });
      }

      throw new AppError(400, 'ASSET_NOT_AVAILABLE', `Asset is not available for allocation (Status: ${asset.status}).`);
    }

    // 3. Verify assignee employee
    if (dto.employeeId) {
      const employee = await tx.user.findUnique({
        where: { id: dto.employeeId }
      });
      if (!employee) {
        throw new AppError(400, 'EMPLOYEE_NOT_FOUND', 'Employee does not exist.');
      }
      if (employee.status !== 'Active') {
        throw new AppError(400, 'EMPLOYEE_INACTIVE', 'Cannot allocate asset to an inactive employee.');
      }
    }

    // 4. Verify assignee department
    if (dto.departmentId) {
      const dept = await tx.department.findUnique({
        where: { id: dto.departmentId }
      });
      if (!dept) {
        throw new AppError(400, 'DEPARTMENT_NOT_FOUND', 'Department does not exist.');
      }
      if (dept.status !== 'Active') {
        throw new AppError(400, 'DEPARTMENT_INACTIVE', 'Cannot allocate asset to an inactive department.');
      }
    }

    // 5. Create allocation record
    const allocation = await tx.allocation.create({
      data: {
        assetId: dto.assetId,
        employeeId: dto.employeeId || null,
        departmentId: dto.departmentId || null,
        expectedReturnDate: dto.expectedReturnDate,
        status: AllocationStatus.Active
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } }
      }
    });

    // 6. Update asset
    const updatedAsset = await tx.asset.update({
      where: { id: dto.assetId },
      data: {
        status: AssetStatus.Allocated,
        currentHolderId: dto.employeeId || null,
        currentDepartmentId: dto.departmentId || null
      }
    });

    return { allocation, asset: updatedAsset };
  });
};
