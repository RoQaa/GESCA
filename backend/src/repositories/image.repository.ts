import { Image, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ImageRepository extends BaseRepository<
  Image,
  Prisma.ImageCreateInput,
  Prisma.ImageUpdateInput
> {
  constructor() {
    super('image');
  }
}

export const imageRepository = new ImageRepository();
