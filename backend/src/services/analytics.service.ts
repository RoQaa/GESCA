import { prisma } from '../config/database.config';
import { GetDashboardStatsQuery } from '../validators/analytics.validator';
import { Prisma } from '@prisma/client';

class AnalyticsService {
  async getDashboardStats(query: GetDashboardStatsQuery, userId: string, role: string) {
    const { startDate, endDate, employeeId } = query;

    const taskWhere: Prisma.TaskWhereInput = { deletedAt: null };
    const visitWhere: Prisma.VisitWhereInput = {};
    const customerWhere: Prisma.CustomerWhereInput = { deletedAt: null };

    // Apply role-based filtering
    if (role === 'SalesEmployee') {
      taskWhere.employeeId = userId;
      visitWhere.employeeId = userId;
    } else if (employeeId) {
      taskWhere.employeeId = employeeId;
      visitWhere.employeeId = employeeId;
    }

    // Apply date filtering
    if (startDate || endDate) {
      const scheduledDateFilter: Prisma.DateTimeFilter = {};
      const createdAtFilter: Prisma.DateTimeFilter = {};

      if (startDate) {
        scheduledDateFilter.gte = new Date(startDate);
        createdAtFilter.gte = new Date(startDate);
      }
      if (endDate) {
        scheduledDateFilter.lte = new Date(endDate);
        createdAtFilter.lte = new Date(endDate);
      }

      taskWhere.scheduledDate = scheduledDateFilter;
      visitWhere.createdAt = createdAtFilter;
    }

    // Execute queries in parallel
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      missedTasks,
      totalVisits,
      totalCustomers,
      recentTasks,
    ] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'PENDING' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'MISSED' } }),
      prisma.visit.count({ where: visitWhere }),
      prisma.customer.count({ where: customerWhere }),
      prisma.task.findMany({
        where: taskWhere,
        take: 5,
        orderBy: { scheduledDate: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
    ]);

    // Calculate basic completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        missedTasks,
        completionRate,
        totalVisits,
        totalCustomers,
      },
      recentTasks,
    };
  }
}

export const analyticsService = new AnalyticsService();
