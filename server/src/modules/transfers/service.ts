import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateTransferDto, UpdateTransferDto } from './validation';
import { AssetStatus, TransferStatus, AllocationStatus } from '@prisma/client';
import { logActivityAndNotify } from '../../lib/activityLogger';

export const requestTransfer = async (dto: CreateTransferDto, requestedById: number) => {
  const asset = await prisma.asset.findUnique({
    where: { id: dto.assetId }
  });

  if (!asset) {
    throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  // Verify asset is currently allocated
  if (asset.status !== AssetStatus.Allocated && asset.status !== AssetStatus.Reserved) {
    throw new AppError(400, 'ASSET_NOT_ASSIGNED', 'Asset is not currently allocated to anyone.');
  }

  // Verify recipient user
  const recipient = await prisma.user.findUnique({
    where: { id: dto.toHolderId }
  });

  if (!recipient) {
    throw new AppError(400, 'RECIPIENT_NOT_FOUND', 'Recipient employee not found.');
  }

  if (recipient.status !== 'Active') {
    throw new AppError(400, 'RECIPIENT_INACTIVE', 'Cannot transfer asset to an inactive employee.');
  }

  if (asset.currentHolderId === dto.toHolderId) {
    throw new AppError(400, 'RECIPIENT_ALREADY_HOLDER', 'Recipient is already the current holder of this asset.');
  }

  return await prisma.$transaction(async (tx) => {
    const tr = await tx.transferRequest.create({
      data: {
        asset: { connect: { id: dto.assetId } },
        toHolder: { connect: { id: dto.toHolderId } },
        requestedBy: { connect: { id: requestedById } },
        fromHolder: asset.currentHolderId ? { connect: { id: asset.currentHolderId } } : undefined,
        status: TransferStatus.Requested
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        fromHolder: { select: { id: true, name: true, email: true } },
        toHolder: { select: { id: true, name: true, email: true } },
        requestedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await logActivityAndNotify(tx, {
      userId: requestedById,
      action: 'TRANSFER_REQUEST',
      entityType: 'TransferRequest',
      entityId: tr.id,
      details: { assetId: dto.assetId, toHolderId: dto.toHolderId },
      notifications: [
        {
          userId: dto.toHolderId,
          type: 'TRANSFER_PENDING',
          message: `A transfer request for Asset ${tr.asset.name} has been raised in your favor.`
        }
      ]
    });

    return tr;
  });
};

export const processTransfer = async (id: number, dto: UpdateTransferDto, approvedById: number) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id }
  });

  if (!transfer) {
    throw new AppError(404, 'TRANSFER_REQUEST_NOT_FOUND', 'Transfer request not found.');
  }

  if (transfer.status !== TransferStatus.Requested) {
    throw new AppError(400, 'REQUEST_ALREADY_PROCESSED', 'Transfer request has already been processed.');
  }

  if (dto.action === 'Reject') {
    return await prisma.$transaction(async (tx) => {
      const tr = await tx.transferRequest.update({
        where: { id },
        data: {
          status: TransferStatus.Rejected,
          approvedBy: { connect: { id: approvedById } }
        },
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          toHolder: { select: { id: true, name: true, email: true } }
        }
      });

      await logActivityAndNotify(tx, {
        userId: approvedById,
        action: 'TRANSFER_REJECT',
        entityType: 'TransferRequest',
        entityId: tr.id,
        details: { assetId: tr.assetId, toHolderId: tr.toHolderId },
        notifications: [
          {
            userId: tr.toHolderId,
            type: 'TRANSFER_REJECTED',
            message: `The transfer request for Asset ${tr.asset.name} was rejected.`
          }
        ]
      });

      return tr;
    });
  }

  // Process Approval: Reallocate asset atomically
  return await prisma.$transaction(async (tx) => {
    // 1. Close current active allocation
    const activeAlloc = await tx.allocation.findFirst({
      where: {
        assetId: transfer.assetId,
        status: AllocationStatus.Active
      }
    });

    if (activeAlloc) {
      await tx.allocation.update({
        where: { id: activeAlloc.id },
        data: {
          status: AllocationStatus.Returned,
          actualReturnDate: new Date(),
          returnConditionNotes: 'Returned via transfer request reallocation approval.'
        }
      });
    }

    // 2. Create new active allocation for the recipient
    const expectedReturnDate = new Date(Date.now() + 86400000 * 30);
    await tx.allocation.create({
      data: {
        assetId: transfer.assetId,
        employeeId: transfer.toHolderId,
        expectedReturnDate,
        status: AllocationStatus.Active
      }
    });

    // 3. Update asset holder references and reset department
    await tx.asset.update({
      where: { id: transfer.assetId },
      data: {
        status: AssetStatus.Allocated,
        currentHolderId: transfer.toHolderId,
        currentDepartmentId: null
      }
    });

    // 4. Set transfer request status to Reallocated
    const updatedTr = await tx.transferRequest.update({
      where: { id },
      data: {
        status: TransferStatus.Reallocated,
        approvedBy: { connect: { id: approvedById } }
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        fromHolder: { select: { id: true, name: true, email: true } },
        toHolder: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // 5. Log activity & notify
    const notifications = [
      {
        userId: transfer.toHolderId,
        type: 'TRANSFER_APPROVED',
        message: `The transfer request for Asset ${updatedTr.asset.name} has been approved.`
      }
    ];

    if (transfer.fromHolderId) {
      notifications.push({
        userId: transfer.fromHolderId,
        type: 'TRANSFER_COMPLETED',
        message: `Asset ${updatedTr.asset.name} has been successfully transferred to ${updatedTr.toHolder.name}.`
      });
    }

    await logActivityAndNotify(tx, {
      userId: approvedById,
      action: 'TRANSFER_APPROVE',
      entityType: 'TransferRequest',
      entityId: transfer.id,
      details: {
        assetId: transfer.assetId,
        fromHolderId: transfer.fromHolderId,
        toHolderId: transfer.toHolderId
      },
      notifications
    });

    return updatedTr;
  });
};
