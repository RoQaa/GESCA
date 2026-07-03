import { prisma } from '../config/database.config';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  UploadImageInput,
  ListImagesQuery,
} from '../validators/image.validator';
import { Prisma } from '@prisma/client';

class ImageService {
  async uploadImage(
    userId: string,
    file: Express.Multer.File,
    data: UploadImageInput
  ) {
    if (!file) {
      throw new AppError('No image file provided', HttpStatus.BAD_REQUEST);
    }

    // Optional: Extract dimensions using a library like image-size (skipping for now to avoid extra deps)
    const width = null;
    const height = null;

    const image = await prisma.image.create({
      data: {
        type: data.type,
        originalPath: `/api/public/${file.filename}`, // Relative path for serving
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width,
        height,
        altText: data.altText,
        uploadedBy: { connect: { id: userId } },
        ...(data.visitId && { visit: { connect: { id: data.visitId } } }),
        ...(data.reportId && { report: { connect: { id: data.reportId } } }),
      },
    });

    return image;
  }

  async getImageById(id: string) {
    const image = await prisma.image.findUnique({
      where: { id, deletedAt: null },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!image) {
      throw new AppError('Image not found', HttpStatus.NOT_FOUND);
    }

    return image;
  }

  async deleteImage(id: string) {
    await this.getImageById(id);

    // Soft delete in DB
    await prisma.image.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // We do NOT delete the actual file to maintain audit trail, 
    // or we could delete it if strict GDPR is required.
    // fs.unlinkSync(path.join(process.cwd(), 'uploads', path.basename(image.originalPath)));

    return true;
  }

  async listImages(query: ListImagesQuery) {
    const { limit, cursor, type, visitId, reportId } = query;

    const where: Prisma.ImageWhereInput = {
      deletedAt: null,
    };

    if (type) where.type = type;
    if (visitId) where.visitId = visitId;
    if (reportId) where.reportId = reportId;

    const images = await prisma.image.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    let nextCursor: string | null = null;
    if (images.length > (limit as number)) {
      const nextItem = images.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: images,
      nextCursor,
    };
  }
}

export const imageService = new ImageService();
