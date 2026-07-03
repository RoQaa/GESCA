import { prisma } from '../config/database.config';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  CreateVisitInput,
  UpdateVisitInput,
  ListVisitsQuery,
} from '../validators/visit.validator';
import { Prisma } from '@prisma/client';

class VisitService {
  async createVisit(data: CreateVisitInput) {
    // Check if task exists and has no visit
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: { visit: true },
    });

    if (!task) {
      throw new AppError('Task not found', HttpStatus.NOT_FOUND);
    }

    if (task.visit) {
      throw new AppError('Visit already exists for this task', HttpStatus.CONFLICT);
    }

    const visit = await prisma.visit.create({
      data: {
        task: { connect: { id: data.taskId } },
        employee: { connect: { id: data.employeeId } },
        notes: data.notes,
      },
    });

    return visit;
  }

  async getVisitById(id: string) {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        task: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        attendances: true,
        report: true,
        images: true,
      },
    });

    if (!visit) {
      throw new AppError('Visit not found', HttpStatus.NOT_FOUND);
    }

    return visit;
  }

  async updateVisit(id: string, data: UpdateVisitInput) {
    await this.getVisitById(id);

    const updateData: Prisma.VisitUpdateInput = {
      status: data.status,
      notes: data.notes,
    };

    if (data.startedAt) {
      updateData.startedAt = new Date(data.startedAt);
    }
    if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt);
    }

    const visit = await prisma.visit.update({
      where: { id },
      data: updateData,
    });

    return visit;
  }

  async listVisits(query: ListVisitsQuery, userId?: string, role?: string) {
    const { limit, cursor, employeeId, taskId, status } = query;

    const where: Prisma.VisitWhereInput = {};

    if (role === 'SalesEmployee' && userId) {
      where.employeeId = userId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (status) {
      where.status = status;
    }

    const visits = await prisma.visit.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true, customer: { select: { name: true } } } },
      },
    });

    let nextCursor: string | null = null;
    if (visits.length > (limit as number)) {
      const nextItem = visits.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: visits,
      nextCursor,
    };
  }
}

export const visitService = new VisitService();
