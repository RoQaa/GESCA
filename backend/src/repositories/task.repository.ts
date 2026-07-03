import { Task, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TaskRepository extends BaseRepository<
  Task,
  Prisma.TaskCreateInput,
  Prisma.TaskUpdateInput
> {
  constructor() {
    super('task');
  }

  // Add custom database methods if needed
}

export const taskRepository = new TaskRepository();
