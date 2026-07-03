import { Attendance, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class AttendanceRepository extends BaseRepository<
  Attendance,
  Prisma.AttendanceCreateInput,
  Prisma.AttendanceUpdateInput
> {
  constructor() {
    super('attendance');
  }

  // Add custom database methods if needed
}

export const attendanceRepository = new AttendanceRepository();
