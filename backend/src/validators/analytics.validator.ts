import { z } from 'zod';

export const getDashboardStatsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employeeId: z.string().uuid().optional(), // For managers filtering by employee
});

export type GetDashboardStatsQuery = z.infer<typeof getDashboardStatsSchema>;
