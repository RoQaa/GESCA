import { z } from 'zod';
import { AttendanceType } from '@prisma/client';

export const logAttendanceSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  type: z.nativeEnum(AttendanceType),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  altitude: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  isMockSuspected: z.boolean().optional().default(false),
  mockScore: z.number().int().min(0).max(100).optional().nullable(),
  mockSignals: z.array(z.string()).optional(),
  deviceInfo: z.record(z.any()).optional().nullable(),
  timestamp: z.string().datetime({ offset: true }),
});

export const getAttendanceSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
});

export const listAttendancesSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  type: z.nativeEnum(AttendanceType).optional(),
});

export type LogAttendanceInput = z.infer<typeof logAttendanceSchema>;
export type ListAttendancesQuery = z.infer<typeof listAttendancesSchema>;
