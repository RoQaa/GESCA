import { z } from 'zod';
import { VisitStatus } from '@prisma/client';

export const createVisitSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  employeeId: z.string().uuid('Invalid employee ID'),
  notes: z.string().optional(),
});

export const updateVisitSchema = z.object({
  status: z.nativeEnum(VisitStatus).optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const getVisitSchema = z.object({
  id: z.string().uuid('Invalid visit ID'),
});

export const listVisitsSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  status: z.nativeEnum(VisitStatus).optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsSchema>;
