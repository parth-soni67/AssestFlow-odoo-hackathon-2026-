import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateMaintenanceRequestDto, AssignTechnicianDto } from './validation';
import { MaintenanceStatus, AssetStatus } from '@prisma/client';
import { logActivityAndNotify } from '../../lib/activityLogger';

export const raiseMaintenanceRequest = async (dto: CreateMaintenanceRequestDto, raisedById: number) => {
  const asset = await prisma.asset.findUnique({
    where: { id: dto.assetId }
  });

  if (!asset) {
    throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  return await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: {
        asset: { connect: { id: dto.assetId } },
        raisedBy: { connect: { id: raisedById } },
        issueDescription: dto.issueDescription,
        priority: dto.priority,
        photo: dto.photo || null,
        status: MaintenanceStatus.Pending
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true, status: true } },
        raisedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await logActivityAndNotify(tx, {
      userId: raisedById,
      action: 'MAINTENANCE_RAISE',
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      details: { assetId: dto.assetId, priority: dto.priority },
      notifications: [
        {
          userId: raisedById,
          type: 'MAINTENANCE_RAISED',
          message: `Your maintenance request for Asset "${request.asset.name}" has been raised.`
        }
      ]
    });

    return request;
  });
};

export const approveRequest = async (id: number, approvedById: number) => {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id }
    });

    if (!request) {
      throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
    }

    if (request.status !== MaintenanceStatus.Pending) {
      throw new AppError(400, 'INVALID_STATE', 'Only pending maintenance requests can be approved.');
    }

    // 1. Update request status to Approved and link approver
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.Approved,
        approvedById
      },
      include: {
        asset: true,
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // 2. Set asset status to UnderMaintenance
    const updatedAsset = await tx.asset.update({
      where: { id: request.assetId },
      data: { status: AssetStatus.UnderMaintenance }
    });

    // 3. Log activity & notify
    await logActivityAndNotify(tx, {
      userId: approvedById,
      action: 'MAINTENANCE_APPROVE',
      entityType: 'MaintenanceRequest',
      entityId: id,
      details: { assetId: request.assetId },
      notifications: [
        {
          userId: updatedRequest.raisedById,
          type: 'MAINTENANCE_APPROVED',
          message: `Your maintenance request for Asset "${updatedRequest.asset.name}" has been approved.`
        }
      ]
    });

    return { request: updatedRequest, asset: updatedAsset };
  });
};

export const rejectRequest = async (id: number, approvedById: number) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
  }

  if (request.status !== MaintenanceStatus.Pending) {
    throw new AppError(400, 'INVALID_STATE', 'Only pending maintenance requests can be rejected.');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.Rejected,
        approvedById
      },
      include: {
        asset: true,
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await logActivityAndNotify(tx, {
      userId: approvedById,
      action: 'MAINTENANCE_REJECT',
      entityType: 'MaintenanceRequest',
      entityId: id,
      details: { assetId: request.assetId },
      notifications: [
        {
          userId: updatedRequest.raisedById,
          type: 'MAINTENANCE_REJECTED',
          message: `Your maintenance request for Asset "${updatedRequest.asset.name}" was rejected.`
        }
      ]
    });

    return { request: updatedRequest };
  });
};

export const resolveRequest = async (id: number, executorId: number) => {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id }
    });

    if (!request) {
      throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
    }

    if (
      request.status === MaintenanceStatus.Resolved ||
      request.status === MaintenanceStatus.Rejected ||
      request.status === MaintenanceStatus.Pending
    ) {
      throw new AppError(400, 'INVALID_STATE', 'Only approved or in-progress maintenance requests can be resolved.');
    }

    // 1. Update request status to Resolved
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: { status: MaintenanceStatus.Resolved },
      include: {
        asset: true,
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // 2. Set asset status back to Available
    const updatedAsset = await tx.asset.update({
      where: { id: request.assetId },
      data: { status: AssetStatus.Available }
    });

    // 3. Log activity & notify
    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'MAINTENANCE_RESOLVE',
      entityType: 'MaintenanceRequest',
      entityId: id,
      details: { assetId: request.assetId },
      notifications: [
        {
          userId: updatedRequest.raisedById,
          type: 'MAINTENANCE_RESOLVED',
          message: `Your maintenance request for Asset "${updatedRequest.asset.name}" has been resolved.`
        }
      ]
    });

    return { request: updatedRequest, asset: updatedAsset };
  });
};

export const assignTechnician = async (id: number, dto: AssignTechnicianDto, executorId: number) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
  }

  if (
    request.status !== MaintenanceStatus.Approved &&
    request.status !== MaintenanceStatus.TechnicianAssigned
  ) {
    throw new AppError(400, 'INVALID_STATE', 'Technicians can only be assigned to approved or already assigned maintenance requests.');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.TechnicianAssigned,
        assignedTechnician: dto.technicianName
      },
      include: {
        asset: true,
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // Log & notify
    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'MAINTENANCE_ASSIGN',
      entityType: 'MaintenanceRequest',
      entityId: id,
      details: { assetId: request.assetId, technicianName: dto.technicianName },
      notifications: [
        {
          userId: updatedRequest.raisedById,
          type: 'MAINTENANCE_ASSIGNED',
          message: `Technician "${dto.technicianName}" has been assigned to your maintenance request for Asset "${updatedRequest.asset.name}".`
        }
      ]
    });

    return updatedRequest;
  });
};

export const startWork = async (id: number, executorId: number) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
  }

  if (request.status !== MaintenanceStatus.TechnicianAssigned) {
    throw new AppError(400, 'INVALID_STATE', 'Work can only start when a technician is assigned.');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: { status: MaintenanceStatus.InProgress },
      include: {
        asset: true,
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // Log & notify
    await logActivityAndNotify(tx, {
      userId: executorId,
      action: 'MAINTENANCE_START',
      entityType: 'MaintenanceRequest',
      entityId: id,
      details: { assetId: request.assetId },
      notifications: [
        {
          userId: updatedRequest.raisedById,
          type: 'MAINTENANCE_STARTED',
          message: `Work has started on your maintenance request for Asset "${updatedRequest.asset.name}".`
        }
      ]
    });

    return updatedRequest;
  });
};
