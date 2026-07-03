import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { analyticsService } from '../services/analytics.service';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const role = (req as any).user.role;

  const stats = await analyticsService.getDashboardStats(req.query as any, userId, role);

  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats,
  });
});
