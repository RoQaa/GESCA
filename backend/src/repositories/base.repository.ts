import { prisma } from '../config/database.config';

/**
 * Base Repository for generic CRUD operations
 */
export class BaseRepository<T, CreateInput, UpdateInput> {
  protected model: any;

  constructor(modelName: string) {
    this.model = (prisma as any)[modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(args?: any): Promise<T[]> {
    return this.model.findMany(args);
  }

  async create(data: CreateInput): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  async count(args?: any): Promise<number> {
    return this.model.count(args);
  }
}
