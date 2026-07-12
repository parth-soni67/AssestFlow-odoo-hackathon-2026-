import { prisma } from '../../lib/prisma';
import { AssetStatus, AllocationStatus, TransferStatus, BookingStatus } from '@prisma/client';

export const getDashboardStats = async () => {
  const [
    availableCount,
    allocatedCount,
    maintenanceCount,
    pendingTransfersCount,
    overdueCount
  ] = await Promise.all([
    prisma.asset.count({ where: { status: AssetStatus.Available } }),
    prisma.asset.count({ where: { status: AssetStatus.Allocated } }),
    prisma.asset.count({ where: { status: AssetStatus.UnderMaintenance } }),
    prisma.transferRequest.count({ where: { status: TransferStatus.Requested } }),
    prisma.allocation.count({ where: { status: AllocationStatus.Overdue } })
  ]);

  // Active bookings today:
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const activeBookingsCount = await prisma.booking.count({
    where: {
      status: BookingStatus.Upcoming,
      startTime: { lte: endOfToday },
      endTime: { gte: startOfToday }
    }
  });

  return {
    availableAssets: availableCount,
    allocatedAssets: allocatedCount,
    underMaintenance: maintenanceCount,
    activeBookingsToday: activeBookingsCount,
    pendingTransfers: pendingTransfersCount,
    overdueReturns: overdueCount
  };
};
