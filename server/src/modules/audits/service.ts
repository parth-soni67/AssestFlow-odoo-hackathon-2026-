import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateAuditCycleDto } from './validation';
import { SubmitAuditItemDto } from './itemValidation';
import { AuditStatus, Role } from '@prisma/client';

export const createAuditCycle = async (dto: CreateAuditCycleDto) => {
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

  // 3. Create the audit cycle
  return await prisma.auditCycle.create({
    data: {
      name: dto.name,
      scopeDepartmentId: dto.scopeDepartmentId || null,
      location: dto.location || null,
      dateRangeStart: new Date(dto.dateRangeStart),
      dateRangeEnd: new Date(dto.dateRangeEnd),
      status: AuditStatus.Open,
      assignedAuditors: dto.assignedAuditors // Prisma stores this directly as a JSON value
    }
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
    return await prisma.auditItem.update({
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
  }

  return await prisma.auditItem.create({
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
};
