import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateAllocationDto, ReturnAllocationDto } from './validation';
import { AssetStatus, AllocationStatus } from '@prisma/client';
import { logActivityAndNotify } from '../../lib/activityLogger';

export const allocateAsset = async (dto: CreateAllocationDto, executorId: number) => {
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

    // 7. Log activity & notify
    const notifications = [];
    if (dto.employeeId) {
      notifications.push({
        userId: dto.employeeId,
        type: 'ALLOCATION_ASSIGNED',
        message: `Asset ${asset.name} (${asset.assetTag}) has been allocated to you.`
      });
    }

    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'ALLOCATION_CREATE',
      entityType: 'Allocation',
      entityId: allocation.id,
      details: {
        assetId: dto.assetId,
        assetTag: asset.assetTag,
        departmentId: dto.departmentId || null,
        employeeId: dto.employeeId || null
      },
      notifications
    });

    return { allocation, asset: updatedAsset };
  });
};

export const returnAsset = async (id: number, dto: ReturnAllocationDto, executorId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the target allocation
    const allocation = await tx.allocation.findUnique({
      where: { id }
    });

    if (!allocation) {
      throw new AppError(404, 'ALLOCATION_NOT_FOUND', 'Allocation record not found.');
    }

    if (allocation.status === AllocationStatus.Returned) {
      throw new AppError(400, 'ALLOCATION_ALREADY_RETURNED', 'This allocation has already been checked in.');
    }

    // 2. Update allocation record
    const updatedAllocation = await tx.allocation.update({
      where: { id },
      data: {
        status: AllocationStatus.Returned,
        actualReturnDate: new Date(),
        returnConditionNotes: dto.returnConditionNotes || null
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } }
      }
    });

    // 3. Update asset status to Available and clear assignee refs
    const updatedAsset = await tx.asset.update({
      where: { id: allocation.assetId },
      data: {
        status: AssetStatus.Available,
        currentHolderId: null,
        currentDepartmentId: null,
        condition: dto.condition || undefined
      }
    });

    // 4. Log activity & notify original assignee
    const notifications = [];
    if (allocation.employeeId) {
      notifications.push({
        userId: allocation.employeeId,
        type: 'ALLOCATION_RETURNED',
        message: `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) return has been checked in.`
      });
    }

    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'ALLOCATION_RETURN',
      entityType: 'Allocation',
      entityId: allocation.id,
      details: {
        assetId: allocation.assetId,
        assetTag: updatedAsset.assetTag,
        condition: dto.condition
      },
      notifications
    });

    return { allocation: updatedAllocation, asset: updatedAsset };
  });
};

export const flagOverdueAllocations = async (executorId?: number) => {
  let finalExecutorId = executorId;
  if (!finalExecutorId) {
    const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
    finalExecutorId = admin ? admin.id : 1;
  }

  // Find active allocations past expected return date
  const overdueAllocations = await prisma.allocation.findMany({
    where: {
      status: AllocationStatus.Active,
      expectedReturnDate: {
        lt: new Date()
      }
    },
    include: {
      asset: true,
      employee: true
    }
  });

  let count = 0;
  for (const alloc of overdueAllocations) {
    await prisma.$transaction(async (tx) => {
      // update allocation to Overdue
      await tx.allocation.update({
        where: { id: alloc.id },
        data: { status: AllocationStatus.Overdue }
      });

      // log activity & notify holder
      const notifs = [];
      if (alloc.employeeId) {
        notifs.push({
          userId: alloc.employeeId,
          type: 'OVERDUE_ALERT',
          message: `Asset ${alloc.asset.name} (${alloc.asset.assetTag}) allocation is overdue. Please return it immediately.`
        });
      }

      await logActivityAndNotify(tx, {
        userId: finalExecutorId!,
        action: 'ALLOCATION_OVERDUE',
        entityType: 'Allocation',
        entityId: alloc.id,
        details: { assetId: alloc.assetId, assetTag: alloc.asset.assetTag },
        notifications: notifs
      });
    });
    count++;
  }

  return { count };
};
