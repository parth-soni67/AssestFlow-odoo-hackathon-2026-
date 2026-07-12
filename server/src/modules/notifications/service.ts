import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export const listNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

export const markAsRead = async (id: number, userId: number) => {
  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  }

  if (notification.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN_NOTIFICATION', 'You do not have access to this notification.');
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
};

export const markAllAsRead = async (userId: number) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: { isRead: true }
  });
};
