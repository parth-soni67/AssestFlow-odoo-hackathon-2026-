import { prisma } from '../../lib/prisma';

export const listActivityLogs = async (params: {
  userId?: number;
  action?: string;
  entityType?: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  const whereClause: any = {};

  if (params.userId) {
    whereClause.userId = params.userId;
  }

  if (params.action) {
    whereClause.action = params.action;
  }

  if (params.entityType) {
    whereClause.entityType = params.entityType;
  }

  if (params.search) {
    whereClause.OR = [
      { action: { contains: params.search, mode: 'insensitive' } },
      { entityType: { contains: params.search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }

  const skip = (params.page - 1) * params.limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip,
      take: params.limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    }),
    prisma.activityLog.count({ where: whereClause })
  ]);

  return {
    logs,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    }
  };
};
