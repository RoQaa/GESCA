import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { attendanceService } from '../services/attendance.service';

export const logAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const attendance = await attendanceService.logAttendance(userId, req.body);
  res.status(201).json({
    success: true,
    message: 'Attendance logged successfully',
    data: attendance,
  });
});

export const listAttendances = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const role = (req as any).user.role;
  
  const result = await attendanceService.listAttendances(req.query as any, userId, role);
  res.status(200).json({
    success: true,
    message: 'Attendances retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getAttendance = catchAsync(async (req: Request, res: Response) => {
  const attendance = await attendanceService.getAttendanceById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Attendance retrieved successfully',
    data: attendance,
  });
});
