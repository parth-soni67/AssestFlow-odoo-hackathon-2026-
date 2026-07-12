import { Prisma } from '@prisma/client';

export const logActivityAndNotify = async (
  tx: Prisma.TransactionClient | any,
  params: {
    userId: number;
    action: string;
    entityType: string;
    entityId: number;
    details?: any;
    notifications?: Array<{
      userId: number;
      type: string;
      message: string;
    }>;
  }
) => {
  // 1. Create activity log record
  await tx.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || null
    }
  });

  // 2. Dispatch notifications
  if (params.notifications && params.notifications.length > 0) {
    for (const notif of params.notifications) {
      await tx.notification.create({
        data: {
          userId: notif.userId,
          type: notif.type,
          message: notif.message,
          isRead: false
        }
      });
    }
  }
};
