import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateMaintenanceRequestDto, AssignTechnicianDto } from './validation';
import { MaintenanceStatus, AssetStatus } from '@prisma/client';

export const raiseMaintenanceRequest = async (dto: CreateMaintenanceRequestDto, raisedById: number) => {
  // 1. Fetch asset to ensure it exists
  const asset = await prisma.asset.findUnique({
    where: { id: dto.assetId }
  });

  if (!asset) {
    throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  // 2. Create the maintenance request (starts as Pending, asset status stays unchanged)
  return await prisma.maintenanceRequest.create({
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

  // Update request status to Rejected, link approver
  const updatedRequest = await prisma.maintenanceRequest.update({
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

  return { request: updatedRequest };
};

export const resolveRequest = async (id: number) => {
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

    return { request: updatedRequest, asset: updatedAsset };
  });
};

export const assignTechnician = async (id: number, dto: AssignTechnicianDto) => {
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

  return await prisma.maintenanceRequest.update({
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
};

export const startWork = async (id: number) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request not found.');
  }

  if (request.status !== MaintenanceStatus.TechnicianAssigned) {
    throw new AppError(400, 'INVALID_STATE', 'Work can only start when a technician is assigned.');
  }

  return await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: MaintenanceStatus.InProgress },
    include: {
      asset: true,
      raisedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });
};
