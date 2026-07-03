import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { visitService } from '../services/visit.service';

export const listVisits = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const role = (req as any).user.role;
  
  const result = await visitService.listVisits(req.query as any, userId, role);
  res.status(200).json({
    success: true,
    message: 'Visits retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getVisit = catchAsync(async (req: Request, res: Response) => {
  const visit = await visitService.getVisitById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Visit retrieved successfully',
    data: visit,
  });
});

export const updateVisit = catchAsync(async (req: Request, res: Response) => {
  const visit = await visitService.updateVisit(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Visit updated successfully',
    data: visit,
  });
});
