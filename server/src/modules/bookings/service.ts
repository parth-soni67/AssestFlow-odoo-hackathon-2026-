import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateBookingDto, ListBookingsDto, RescheduleBookingDto } from './validation';
import { BookingStatus } from '@prisma/client';
import { logActivityAndNotify } from '../../lib/activityLogger';

export const createBooking = async (dto: CreateBookingDto, bookedById: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch asset and check if bookable
    const asset = await tx.asset.findUnique({
      where: { id: dto.resourceAssetId }
    });

    if (!asset) {
      throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
    }

    if (!asset.isBookable) {
      throw new AppError(400, 'ASSET_NOT_BOOKABLE', 'This asset is not set as a bookable shared resource.');
    }

    // 2. Overlap validation
    const conflict = await tx.booking.findFirst({
      where: {
        resourceAssetId: dto.resourceAssetId,
        status: { in: [BookingStatus.Upcoming, BookingStatus.Ongoing] },
        startTime: { lt: dto.endTime },
        endTime: { gt: dto.startTime }
      },
      include: {
        bookedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (conflict) {
      throw new AppError(400, 'BOOKING_OVERLAP', 'The requested booking slot overlaps with an existing booking.', {
        conflictingBooking: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          bookedBy: conflict.bookedBy
        }
      });
    }

    // 3. Create the booking
    const booking = await tx.booking.create({
      data: {
        asset: { connect: { id: dto.resourceAssetId } },
        bookedBy: { connect: { id: bookedById } },
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: BookingStatus.Upcoming
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        bookedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // 4. Log activity & notify
    await logActivityAndNotify(tx, {
      userId: bookedById,
      action: 'BOOKING_CREATE',
      entityType: 'Booking',
      entityId: booking.id,
      details: { resourceAssetId: dto.resourceAssetId, startTime: dto.startTime, endTime: dto.endTime },
      notifications: [
        {
          userId: bookedById,
          type: 'BOOKING_CONFIRMED',
          message: `Your booking for resource "${booking.asset.name}" has been confirmed.`
        }
      ]
    });

    return booking;
  });
};

export const listBookings = async (dto: ListBookingsDto) => {
  const whereClause: any = {
    resourceAssetId: dto.resourceAssetId
  };

  if (dto.start) {
    whereClause.endTime = { gte: dto.start };
  }

  if (dto.end) {
    whereClause.startTime = { lte: dto.end };
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { startTime: 'asc' },
    include: {
      bookedBy: { select: { id: true, name: true, email: true } }
    }
  });

  return { bookings };
};

export const cancelBooking = async (id: number, userId: number, role: string) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking reservation not found.');
    }

    // Ownership & privilege check
    const isOwner = booking.bookedById === userId;
    const isPrivileged = role === 'Admin' || role === 'AssetManager';

    if (!isOwner && !isPrivileged) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to cancel this booking.');
    }

    if (booking.status === BookingStatus.Cancelled) {
      throw new AppError(400, 'BOOKING_ALREADY_CANCELLED', 'This booking has already been cancelled.');
    }

    if (booking.status === BookingStatus.Completed) {
      throw new AppError(400, 'BOOKING_ALREADY_COMPLETED', 'Cannot cancel a completed booking.');
    }

    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { status: BookingStatus.Cancelled },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        bookedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // Log & notify
    await logActivityAndNotify(tx, {
      userId: userId,
      action: 'BOOKING_CANCEL',
      entityType: 'Booking',
      entityId: updatedBooking.id,
      details: { resourceAssetId: updatedBooking.resourceAssetId },
      notifications: [
        {
          userId: updatedBooking.bookedById,
          type: 'BOOKING_CANCELLED',
          message: `Your booking for resource "${updatedBooking.asset.name}" has been cancelled.`
        }
      ]
    });

    return updatedBooking;
  });
};

export const rescheduleBooking = async (id: number, dto: RescheduleBookingDto, userId: number, role: string) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking reservation not found.');
    }

    // Ownership & privilege check
    const isOwner = booking.bookedById === userId;
    const isPrivileged = role === 'Admin' || role === 'AssetManager';

    if (!isOwner && !isPrivileged) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to reschedule this booking.');
    }

    if (booking.status !== BookingStatus.Upcoming) {
      throw new AppError(400, 'INVALID_BOOKING_STATE', 'Only upcoming bookings can be rescheduled.');
    }

    // Overlap validation (excluding this booking itself)
    const conflict = await tx.booking.findFirst({
      where: {
        resourceAssetId: booking.resourceAssetId,
        id: { not: id },
        status: { in: [BookingStatus.Upcoming, BookingStatus.Ongoing] },
        startTime: { lt: dto.endTime },
        endTime: { gt: dto.startTime }
      },
      include: {
        bookedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (conflict) {
      throw new AppError(400, 'BOOKING_OVERLAP', 'The requested rescheduled slot overlaps with an existing booking.', {
        conflictingBooking: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          bookedBy: conflict.bookedBy
        }
      });
    }

    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        startTime: dto.startTime,
        endTime: dto.endTime
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        bookedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // Log & notify
    await logActivityAndNotify(tx, {
      userId: userId,
      action: 'BOOKING_RESCHEDULE',
      entityType: 'Booking',
      entityId: updatedBooking.id,
      details: { resourceAssetId: updatedBooking.resourceAssetId, startTime: dto.startTime, endTime: dto.endTime },
      notifications: [
        {
          userId: updatedBooking.bookedById,
          type: 'BOOKING_RESCHEDULED',
          message: `Your booking for resource "${updatedBooking.asset.name}" has been rescheduled.`
        }
      ]
    });

    return updatedBooking;
  });
};

export const sendBookingReminders = async () => {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 1000 * 60 * 30);

  // 1. Fetch upcoming bookings starting in next 30 minutes
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.Upcoming,
      startTime: {
        gt: now,
        lte: thirtyMinutesFromNow
      }
    },
    include: {
      asset: { select: { name: true } }
    }
  });

  let remindersCreated = 0;

  for (const booking of upcomingBookings) {
    const reminderMessage = `Reminder: Your reservation for "${booking.asset.name}" starts soon at ${new Date(booking.startTime).toLocaleTimeString()}. (Booking ID: ${booking.id})`;

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: booking.bookedById,
        type: 'BOOKING_REMINDER',
        message: {
          contains: `(Booking ID: ${booking.id})`
        }
      }
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: booking.bookedById,
          type: 'BOOKING_REMINDER',
          message: reminderMessage
        }
      });
      remindersCreated++;
    }
  }

  return { count: remindersCreated };
};
