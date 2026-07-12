import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateAssetDto, ListAssetsQuery } from './validation';
import { AssetStatus, Prisma } from '@prisma/client';

export const registerAsset = async (dto: CreateAssetDto) => {
  // Validate category existence
  const category = await prisma.assetCategory.findUnique({
    where: { id: dto.categoryId }
  });

  if (!category) {
    throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Asset category does not exist.');
  }

  // Generate unique sequential tag: AF-XXXX based on highest existing tag value
  const lastAsset = await prisma.asset.findFirst({
    where: { assetTag: { startsWith: 'AF-' } },
    orderBy: { assetTag: 'desc' },
    select: { assetTag: true }
  });
  
  let nextSeq = 1;
  if (lastAsset) {
    const lastNum = parseInt(lastAsset.assetTag.replace('AF-', ''), 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }
  const assetTag = `AF-${nextSeq.toString().padStart(4, '0')}`;

  const photosDocsJson = dto.photosDocs !== undefined
    ? (dto.photosDocs === null ? Prisma.DbNull : (dto.photosDocs as Prisma.InputJsonValue))
    : Prisma.DbNull;

  return await prisma.asset.create({
    data: {
      name: dto.name,
      categoryId: dto.categoryId,
      assetTag,
      serialNumber: dto.serialNumber,
      qrCode: dto.qrCode || null,
      acquisitionDate: dto.acquisitionDate,
      acquisitionCost: dto.acquisitionCost,
      condition: dto.condition,
      location: dto.location,
      photosDocs: photosDocsJson,
      isBookable: dto.isBookable || false,
      status: AssetStatus.Available
    },
    include: {
      category: {
        select: { id: true, name: true }
      }
    }
  });
};

export const listAssets = async (query: ListAssetsQuery) => {
  const where: Prisma.AssetWhereInput = {};

  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  if (query.departmentId !== undefined) {
    where.currentDepartmentId = query.departmentId;
  }

  if (query.status !== undefined) {
    where.status = query.status;
  }

  if (query.isBookable !== undefined) {
    where.isBookable = query.isBookable;
  }

  if (query.search) {
    const searchLower = query.search.trim();
    where.OR = [
      { name: { contains: searchLower, mode: 'insensitive' } },
      { assetTag: { contains: searchLower, mode: 'insensitive' } },
      { serialNumber: { contains: searchLower, mode: 'insensitive' } },
      { qrCode: { contains: searchLower, mode: 'insensitive' } },
      { location: { contains: searchLower, mode: 'insensitive' } }
    ];
  }

  return await prisma.asset.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true }
      },
      currentDepartment: {
        select: { id: true, name: true }
      },
      currentHolder: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { id: 'asc' }
  });
};

export const fetchAssetById = async (id: number) => {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, customFields: true }
      },
      currentDepartment: {
        select: { id: true, name: true }
      },
      currentHolder: {
        select: { id: true, name: true, email: true }
      },
      allocations: {
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          },
          department: {
            select: { id: true, name: true }
          }
        },
        orderBy: { allocatedDate: 'desc' }
      },
      maintenanceRequests: {
        include: {
          raisedBy: {
            select: { id: true, name: true }
          },
          approvedBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!asset) {
    throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  return asset;
};
