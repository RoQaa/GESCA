import { z } from 'zod';
import { ImageType } from '@prisma/client';

export const uploadImageSchema = z.object({
  type: z.nativeEnum(ImageType),
  visitId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
  altText: z.string().optional(),
}).refine((data) => {
  if (data.type === 'VISIT_PHOTO' && !data.visitId) {
    return false;
  }
  if (data.type === 'REPORT_ATTACHMENT' && !data.reportId) {
    return false;
  }
  return true;
}, {
  message: "VISIT_PHOTO requires visitId, REPORT_ATTACHMENT requires reportId",
  path: ['type'],
});

export const getImageSchema = z.object({
  id: z.string().uuid('Invalid image ID'),
});

export const listImagesSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  type: z.nativeEnum(ImageType).optional(),
  visitId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type ListImagesQuery = z.infer<typeof listImagesSchema>;
