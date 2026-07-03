import { z } from 'zod';

export const createReportProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  quantity: z.number().int().nonnegative().optional(),
  unitPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const createReportCompetitorSchema = z.object({
  name: z.string().min(2, 'Competitor name is required'),
  product: z.string().optional(),
  price: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const createReportSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  customerFeedback: z.string().optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
  products: z.array(createReportProductSchema).optional(),
  competitors: z.array(createReportCompetitorSchema).optional(),
});

export const getReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
});

export const listReportsSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsSchema>;
