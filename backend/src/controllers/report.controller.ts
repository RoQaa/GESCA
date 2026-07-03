import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { reportService } from '../services/report.service';

export const createReport = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const report = await reportService.createReport(userId, req.body);
  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: report,
  });
});

export const listReports = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.listReports(req.query as any);
  res.status(200).json({
    success: true,
    message: 'Reports retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.getReportById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Report retrieved successfully',
    data: report,
  });
});
