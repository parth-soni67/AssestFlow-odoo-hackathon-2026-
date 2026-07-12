import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateCategoryDto, UpdateCategoryDto } from './validation';
import { Prisma } from '@prisma/client';

export const listCategories = async () => {
  return await prisma.assetCategory.findMany({
    include: {
      _count: {
        select: { assets: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const createCategory = async (dto: CreateCategoryDto) => {
  const existing = await prisma.assetCategory.findUnique({
    where: { name: dto.name }
  });

  if (existing) {
    throw new AppError(400, 'CATEGORY_NAME_DUPLICATE', 'Category name already exists.');
  }

  // Cast custom fields to Prisma.InputJsonValue safely
  const customFieldsJson = dto.customFields !== undefined
    ? (dto.customFields === null ? Prisma.DbNull : (dto.customFields as Prisma.InputJsonValue))
    : undefined;

  return await prisma.assetCategory.create({
    data: {
      name: dto.name,
      customFields: customFieldsJson ?? Prisma.DbNull
    }
  });
};

export const updateCategory = async (id: number, dto: UpdateCategoryDto) => {
  const category = await prisma.assetCategory.findUnique({
    where: { id }
  });

  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Asset category does not exist.');
  }

  if (dto.name) {
    const existing = await prisma.assetCategory.findFirst({
      where: {
        name: dto.name,
        NOT: { id }
      }
    });

    if (existing) {
      throw new AppError(400, 'CATEGORY_NAME_DUPLICATE', 'Category name already exists.');
    }
  }

  const customFieldsJson = dto.customFields !== undefined
    ? (dto.customFields === null ? Prisma.DbNull : (dto.customFields as Prisma.InputJsonValue))
    : undefined;

  return await prisma.assetCategory.update({
    where: { id },
    data: {
      name: dto.name !== undefined ? dto.name : undefined,
      customFields: customFieldsJson
    }
  });
};

export const deleteCategory = async (id: number) => {
  const category = await prisma.assetCategory.findUnique({
    where: { id }
  });

  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Asset category does not exist.');
  }

  // Block deletion if assets are assigned
  const assetCount = await prisma.asset.count({
    where: { categoryId: id }
  });

  if (assetCount > 0) {
    throw new AppError(400, 'ASSETS_ASSIGNED_TO_CATEGORY', 'Cannot delete category that contains registered assets.');
  }

  await prisma.assetCategory.delete({
    where: { id }
  });
};
