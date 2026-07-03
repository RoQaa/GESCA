import { prisma } from '../config/database.config';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  LogAttendanceInput,
  ListAttendancesQuery,
} from '../validators/attendance.validator';
import { Prisma, VisitStatus } from '@prisma/client';
import { getDistanceInMeters } from '../utils/geo.util'; // We will create this

class AttendanceService {
  async logAttendance(employeeId: string, data: LogAttendanceInput) {
    // 1. Validate Visit exists and belongs to employee
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId },
      include: {
        task: {
          include: { location: true },
        },
      },
    });

    if (!visit) {
      throw new AppError('Visit not found', HttpStatus.NOT_FOUND);
    }

    if (visit.employeeId !== employeeId) {
      throw new AppError('Unauthorized: Visit belongs to another employee', HttpStatus.FORBIDDEN);
    }

    // 2. Validate state transitions
    if (data.type === 'CHECK_IN' && visit.status !== 'PENDING') {
      throw new AppError('Cannot check in: Visit is not in PENDING state', HttpStatus.BAD_REQUEST);
    }

    if (data.type === 'CHECK_OUT' && visit.status !== 'CHECKED_IN') {
      throw new AppError('Cannot check out: Visit is not in CHECKED_IN state', HttpStatus.BAD_REQUEST);
    }

    // 3. Calculate distance from target if location exists
    let distanceFromTarget: number | null = null;
    const targetLocation = visit.task.location;

    if (targetLocation && targetLocation.latitude && targetLocation.longitude) {
      distanceFromTarget = getDistanceInMeters(
        { lat: data.latitude, lng: data.longitude },
        { lat: Number(targetLocation.latitude), lng: Number(targetLocation.longitude) }
      );
    }

    // 4. Log the attendance in a transaction to also update the Visit state
    const result = await prisma.$transaction(async (tx) => {
      // Create attendance record
      const attendance = await tx.attendance.create({
        data: {
          visit: { connect: { id: data.visitId } },
          employee: { connect: { id: employeeId } },
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          speed: data.speed,
          heading: data.heading,
          distanceFromTarget,
          isMockSuspected: data.isMockSuspected,
          mockScore: data.mockScore,
          mockSignals: data.mockSignals,
          deviceInfo: data.deviceInfo || Prisma.DbNull,
          timestamp: new Date(data.timestamp),
        },
      });

      // Update visit status based on attendance type
      const newStatus = data.type === 'CHECK_IN' ? VisitStatus.CHECKED_IN : VisitStatus.COMPLETED;
      
      const updateData: Prisma.VisitUpdateInput = {
        status: newStatus,
      };

      if (data.type === 'CHECK_IN') {
        updateData.startedAt = attendance.timestamp;
        
        // Also update task status if it's currently PENDING
        if (visit.task.status === 'PENDING') {
          await tx.task.update({
            where: { id: visit.taskId },
            data: { status: 'IN_PROGRESS' },
          });
        }
      } else if (data.type === 'CHECK_OUT') {
        updateData.completedAt = attendance.timestamp;
        
        // Update task status to COMPLETED
        await tx.task.update({
          where: { id: visit.taskId },
          data: { status: 'COMPLETED' },
        });
      }

      await tx.visit.update({
        where: { id: visit.id },
        data: updateData,
      });

      return attendance;
    });

    return result;
  }

  async getAttendanceById(id: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        visit: { select: { id: true, status: true, task: { select: { title: true } } } },
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!attendance) {
      throw new AppError('Attendance not found', HttpStatus.NOT_FOUND);
    }

    return attendance;
  }

  async listAttendances(query: ListAttendancesQuery, userId?: string, role?: string) {
    const { limit, cursor, visitId, employeeId, type } = query;

    const where: Prisma.AttendanceWhereInput = {};

    if (role === 'SalesEmployee' && userId) {
      where.employeeId = userId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (visitId) {
      where.visitId = visitId;
    }

    if (type) {
      where.type = type;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { timestamp: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    let nextCursor: string | null = null;
    if (attendances.length > (limit as number)) {
      const nextItem = attendances.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: attendances,
      nextCursor,
    };
  }
}

export const attendanceService = new AttendanceService();
