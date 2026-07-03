import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  customerId: z.string().uuid('Invalid customer ID'),
  locationId: z.string().uuid('Invalid location ID').optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  scheduledDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  priority: z.number().int().min(1).max(3).optional().default(1),
  notes: z.string().optional(),
});

export const updateTaskSchema = z.object({
  employeeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  scheduledDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  notes: z.string().optional(),
});

export const getTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
});

export const listTasksSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
