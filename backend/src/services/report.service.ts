import { prisma } from '../config/database.config';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  CreateReportInput,
  ListReportsQuery,
} from '../validators/report.validator';
import { Prisma } from '@prisma/client';

class ReportService {
  async createReport(employeeId: string, data: CreateReportInput) {
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId },
      include: { report: true },
    });

    if (!visit) {
      throw new AppError('Visit not found', HttpStatus.NOT_FOUND);
    }

    if (visit.employeeId !== employeeId) {
      throw new AppError('Unauthorized: Visit belongs to another employee', HttpStatus.FORBIDDEN);
    }

    if (visit.report) {
      throw new AppError('A report already exists for this visit', HttpStatus.CONFLICT);
    }

    const report = await prisma.visitReport.create({
      data: {
        summary: data.summary,
        customerFeedback: data.customerFeedback,
        nextAction: data.nextAction,
        notes: data.notes,
        visit: { connect: { id: data.visitId } },
        products: data.products && data.products.length > 0
          ? { create: data.products }
          : undefined,
        competitors: data.competitors && data.competitors.length > 0
          ? { create: data.competitors }
          : undefined,
      },
      include: {
        products: true,
        competitors: true,
      },
    });

    return report;
  }

  async getReportById(id: string) {
    const report = await prisma.visitReport.findUnique({
      where: { id },
      include: {
        products: true,
        competitors: true,
        images: true,
        visit: {
          select: {
            id: true,
            status: true,
            employee: { select: { id: true, firstName: true, lastName: true } },
            task: { select: { title: true, customer: { select: { name: true } } } },
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', HttpStatus.NOT_FOUND);
    }

    return report;
  }

  async listReports(query: ListReportsQuery) {
    const { limit, cursor, visitId } = query;

    const where: Prisma.VisitReportWhereInput = {};

    if (visitId) {
      where.visitId = visitId;
    }

    const reports = await prisma.visitReport.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { submittedAt: 'desc' },
      include: {
        visit: {
          select: {
            id: true,
            employee: { select: { id: true, firstName: true, lastName: true } },
            task: { select: { customer: { select: { name: true } } } },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (reports.length > (limit as number)) {
      const nextItem = reports.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: reports,
      nextCursor,
    };
  }
}

export const reportService = new ReportService();
