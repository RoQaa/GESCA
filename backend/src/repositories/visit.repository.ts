import { Visit, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class VisitRepository extends BaseRepository<
  Visit,
  Prisma.VisitCreateInput,
  Prisma.VisitUpdateInput
> {
  constructor() {
    super('visit');
  }

  // Add custom database methods if needed
}

export const visitRepository = new VisitRepository();
