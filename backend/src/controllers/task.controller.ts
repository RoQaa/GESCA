import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { taskService } from '../services/task.service';

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const task = await taskService.createTask(userId, req.body);
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  });
});

export const listTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const role = (req as any).user.role; // Assuming role is attached to payload or fetched middleware
  
  const result = await taskService.listTasks(req.query as any, userId, role);
  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const query = { ...req.query, employeeId: userId };
  
  const result = await taskService.listTasks(query as any, userId, 'SalesEmployee');
  res.status(200).json({
    success: true,
    message: 'My tasks retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: task,
  });
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: task,
  });
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id as string);
  res.status(204).send();
});
