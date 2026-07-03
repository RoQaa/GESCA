import { prisma } from '../config/database.config';
import { taskRepository } from '../repositories/task.repository';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validator';
import { Prisma } from '@prisma/client';

class TaskService {
  async createTask(userId: string, data: CreateTaskInput) {
    // Validate employee exists
    const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', HttpStatus.NOT_FOUND);
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new AppError('Customer not found', HttpStatus.NOT_FOUND);
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        // Simplification for time handling; in a real app, combine date + time robustly
        scheduledStartTime: data.scheduledStartTime ? new Date(`${data.scheduledDate}T${data.scheduledStartTime}:00Z`) : null,
        scheduledEndTime: data.scheduledEndTime ? new Date(`${data.scheduledDate}T${data.scheduledEndTime}:00Z`) : null,
        priority: data.priority,
        notes: data.notes,
        createdBy: userId,
        employee: { connect: { id: data.employeeId } },
        customer: { connect: { id: data.customerId } },
        ...(data.locationId && { location: { connect: { id: data.locationId } } }),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return task;
  }

  async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        customer: { select: { id: true, name: true, address: true, phone: true } },
        location: true,
        visit: true,
      },
    });

    if (!task) {
      throw new AppError('Task not found', HttpStatus.NOT_FOUND);
    }

    return task;
  }

  async updateTask(id: string, data: UpdateTaskInput) {
    await this.getTaskById(id);

    // Dynamic data mapping for relations
    const updateData: Prisma.TaskUpdateInput = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      notes: data.notes,
    };

    if (data.scheduledDate) {
      updateData.scheduledDate = new Date(data.scheduledDate);
    }

    // Example handling of time if provided
    if (data.scheduledDate && data.scheduledStartTime) {
      updateData.scheduledStartTime = new Date(`${data.scheduledDate}T${data.scheduledStartTime}:00Z`);
    }

    if (data.scheduledDate && data.scheduledEndTime) {
      updateData.scheduledEndTime = new Date(`${data.scheduledDate}T${data.scheduledEndTime}:00Z`);
    }

    if (data.employeeId) {
      updateData.employee = { connect: { id: data.employeeId } };
    }

    if (data.customerId) {
      updateData.customer = { connect: { id: data.customerId } };
    }

    if (data.locationId) {
      updateData.location = { connect: { id: data.locationId } };
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return task;
  }

  async deleteTask(id: string) {
    await this.getTaskById(id);
    return taskRepository.update(id, { deletedAt: new Date() });
  }

  async listTasks(query: ListTasksQuery, userId?: string, role?: string) {
    const { limit, cursor, employeeId, customerId, status, startDate, endDate } = query;

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    // If SalesEmployee, they can only see their own tasks
    if (role === 'SalesEmployee' && userId) {
      where.employeeId = userId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const tasks = await prisma.task.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { scheduledDate: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    let nextCursor: string | null = null;
    if (tasks.length > (limit as number)) {
      const nextItem = tasks.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: tasks,
      nextCursor,
    };
  }
}

export const taskService = new TaskService();
