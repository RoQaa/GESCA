import { VisitReport, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ReportRepository extends BaseRepository<
  VisitReport,
  Prisma.VisitReportCreateInput,
  Prisma.VisitReportUpdateInput
> {
  constructor() {
    super('visitReport');
  }
}

export const reportRepository = new ReportRepository();
