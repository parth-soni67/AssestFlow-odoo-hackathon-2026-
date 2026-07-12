import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateAuditCycleDto } from './validation';
import { SubmitAuditItemDto } from './itemValidation';
import { AuditStatus, Role, AssetStatus, AuditResult } from '@prisma/client';
import { logActivityAndNotify } from '../../lib/activityLogger';

export const createAuditCycle = async (dto: CreateAuditCycleDto, executorId: number) => {
  // 1. If department ID is provided, verify it exists
  if (dto.scopeDepartmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: dto.scopeDepartmentId }
    });
    if (!dept) {
      throw new AppError(404, 'DEPARTMENT_NOT_FOUND', `Scope department with ID ${dto.scopeDepartmentId} not found.`);
    }
  }

  // 2. Verify all assigned auditors exist
  for (const auditorId of dto.assignedAuditors) {
    const auditor = await prisma.user.findUnique({
      where: { id: auditorId }
    });
    if (!auditor) {
      throw new AppError(400, 'INVALID_AUDITOR', `Assigned auditor with user ID ${auditorId} not found.`);
    }
  }

  // 3. Create the audit cycle in a transaction
  return await prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.create({
      data: {
        name: dto.name,
        scopeDepartmentId: dto.scopeDepartmentId || null,
        location: dto.location || null,
        dateRangeStart: new Date(dto.dateRangeStart),
        dateRangeEnd: new Date(dto.dateRangeEnd),
        status: AuditStatus.Open,
        assignedAuditors: dto.assignedAuditors
      }
    });

    // 4. Log & notify assigned auditors
    const notifications = dto.assignedAuditors.map(auditorId => ({
      userId: auditorId,
      type: 'AUDIT_ASSIGNED',
      message: `You have been assigned as an auditor for Audit Cycle "${cycle.name}".`
    }));

    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'AUDIT_CREATE',
      entityType: 'AuditCycle',
      entityId: cycle.id,
      details: { name: dto.name, scopeDepartmentId: dto.scopeDepartmentId || null },
      notifications
    });

    return cycle;
  });
};

export const submitAuditItem = async (cycleId: number, dto: SubmitAuditItemDto, auditorId: number, userRole: Role) => {
  // 1. Fetch audit cycle to ensure it exists and is Open
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId }
  });

  if (!cycle) {
    throw new AppError(404, 'AUDIT_CYCLE_NOT_FOUND', 'Audit cycle not found.');
  }

  if (cycle.status !== AuditStatus.Open) {
    throw new AppError(400, 'AUDIT_CYCLE_CLOSED', 'Audit cycle is closed. Cannot log audit results.');
  }

  // 2. Validate auditor authorization
  const auditorsList = Array.isArray(cycle.assignedAuditors) 
    ? (cycle.assignedAuditors as number[]) 
    : [];
  
  const isAuthorized = userRole === Role.Admin || userRole === Role.AssetManager || auditorsList.includes(auditorId);
  if (!isAuthorized) {
    throw new AppError(403, 'UNAUTHORIZED_AUDITOR', 'You are not assigned as an auditor for this cycle.');
  }

  // 3. Fetch asset to ensure it exists
  const asset = await prisma.asset.findUnique({
    where: { id: dto.assetId }
  });

  if (!asset) {
    throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  // 4. Validate scope restrictions
  if (cycle.scopeDepartmentId && asset.currentDepartmentId !== cycle.scopeDepartmentId) {
    throw new AppError(400, 'OUT_OF_SCOPE', 'Asset department does not match audit cycle scope.');
  }

  if (cycle.location && asset.location?.toLowerCase().trim() !== cycle.location.toLowerCase().trim()) {
    throw new AppError(400, 'OUT_OF_SCOPE', 'Asset location does not match audit cycle scope.');
  }

  // 5. Resilient upsert check: does an AuditItem already exist for this asset in this cycle?
  const existingItem = await prisma.auditItem.findFirst({
    where: {
      auditCycleId: cycleId,
      assetId: dto.assetId
    }
  });

  if (existingItem) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.auditItem.update({
        where: { id: existingItem.id },
        data: {
          result: dto.result,
          notes: dto.notes || null,
          auditorId: auditorId
        },
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          auditor: { select: { id: true, name: true, email: true } }
        }
      });

      // Log action
      await logActivityAndNotify(tx, {
        userId: auditorId,
        action: 'AUDIT_SUBMIT',
        entityType: 'AuditItem',
        entityId: item.id,
        details: { cycleId, assetId: dto.assetId, result: dto.result }
      });

      return item;
    });
  }

  return await prisma.$transaction(async (tx) => {
    const item = await tx.auditItem.create({
      data: {
        auditCycle: { connect: { id: cycleId } },
        asset: { connect: { id: dto.assetId } },
        result: dto.result,
        notes: dto.notes || null,
        auditor: { connect: { id: auditorId } }
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        auditor: { select: { id: true, name: true, email: true } }
      }
    });

    // Log action
    await logActivityAndNotify(tx, {
      userId: auditorId,
      action: 'AUDIT_SUBMIT',
      entityType: 'AuditItem',
      entityId: item.id,
      details: { cycleId, assetId: dto.assetId, result: dto.result }
    });

    return item;
  });
};

export const generateDiscrepancyReport = async (cycleId: number) => {
  // 1. Fetch audit cycle to ensure it exists
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId }
  });

  if (!cycle) {
    throw new AppError(404, 'AUDIT_CYCLE_NOT_FOUND', 'Audit cycle not found.');
  }

  // 2. Fetch scoped active assets
  const assetWhere: any = {
    status: {
      in: [AssetStatus.Available, AssetStatus.Allocated, AssetStatus.Reserved, AssetStatus.UnderMaintenance]
    }
  };

  if (cycle.scopeDepartmentId) {
    assetWhere.currentDepartmentId = cycle.scopeDepartmentId;
  }

  if (cycle.location) {
    assetWhere.location = {
      equals: cycle.location,
      mode: 'insensitive'
    };
  }

  const scopedAssets = await prisma.asset.findMany({
    where: assetWhere,
    include: {
      currentDepartment: { select: { id: true, name: true } },
      currentHolder: { select: { id: true, name: true, email: true } }
    }
  });

  // 3. Fetch logged audit items in this cycle
  const auditItems = await prisma.auditItem.findMany({
    where: { auditCycleId: cycleId },
    include: {
      asset: {
        include: {
          currentDepartment: { select: { id: true, name: true } },
          currentHolder: { select: { id: true, name: true, email: true } }
        }
      },
      auditor: { select: { id: true, name: true, email: true } }
    }
  });

  // 4. Map assets to categorized arrays
  const itemsMap = new Map<number, any>();
  for (const item of auditItems) {
    itemsMap.set(item.assetId, item);
  }

  const verified: any[] = [];
  const missing: any[] = [];
  const damaged: any[] = [];
  const pending: any[] = [];

  for (const asset of scopedAssets) {
    const item = itemsMap.get(asset.id);
    if (!item) {
      pending.push({
        id: asset.id,
        name: asset.name,
        assetTag: asset.assetTag,
        serialNumber: asset.serialNumber,
        location: asset.location,
        status: asset.status,
        currentDepartment: asset.currentDepartment,
        currentHolder: asset.currentHolder
      });
    } else {
      const logDetails = {
        id: item.id,
        result: item.result,
        notes: item.notes,
        loggedAt: (item as any).createdAt,
        auditor: item.auditor,
        asset: {
          id: asset.id,
          name: asset.name,
          assetTag: asset.assetTag,
          serialNumber: asset.serialNumber,
          location: asset.location,
          status: asset.status,
          currentDepartment: asset.currentDepartment,
          currentHolder: asset.currentHolder
        }
      };

      if (item.result === AuditResult.Verified) {
        verified.push(logDetails);
      } else if (item.result === AuditResult.Missing) {
        missing.push(logDetails);
      } else if (item.result === AuditResult.Damaged) {
        damaged.push(logDetails);
      }
    }
  }

  return {
    summary: {
      totalScoped: scopedAssets.length,
      totalAudited: auditItems.length,
      verifiedCount: verified.length,
      missingCount: missing.length,
      damagedCount: damaged.length,
      pendingCount: pending.length
    },
    discrepancies: {
      missing,
      damaged,
      pending
    },
    verified
  };
};

export const closeAuditCycle = async (cycleId: number, executorId: number) => {
  // 1. Fetch audit cycle to ensure it exists and is open
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId }
  });

  if (!cycle) {
    throw new AppError(404, 'AUDIT_CYCLE_NOT_FOUND', 'Audit cycle not found.');
  }

  if (cycle.status !== AuditStatus.Open) {
    throw new AppError(400, 'AUDIT_CYCLE_CLOSED', 'Audit cycle is already closed.');
  }

  // 2. Fetch logged missing items in this cycle
  const missingItems = await prisma.auditItem.findMany({
    where: {
      auditCycleId: cycleId,
      result: AuditResult.Missing
    },
    select: { assetId: true }
  });

  const missingAssetIds = missingItems.map(item => item.assetId);

  // 3. Execute updates in a transaction
  return await prisma.$transaction(async (tx) => {
    // A. Update audit cycle status to Closed
    const updatedCycle = await tx.auditCycle.update({
      where: { id: cycleId },
      data: { status: AuditStatus.Closed }
    });

    // B. If there are missing assets, transition them to Lost and clear assignee references
    if (missingAssetIds.length > 0) {
      await tx.asset.updateMany({
        where: {
          id: { in: missingAssetIds }
        },
        data: {
          status: AssetStatus.Lost,
          currentHolderId: null,
          currentDepartmentId: null
        }
      });
    }

    // C. Log & notify
    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'AUDIT_CLOSE',
      entityType: 'AuditCycle',
      entityId: cycleId,
      details: { name: cycle.name, missingAssetCount: missingAssetIds.length }
    });

    return updatedCycle;
  });
};
