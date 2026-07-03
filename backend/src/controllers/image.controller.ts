import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { imageService } from '../services/image.service';

export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const file = req.file as Express.Multer.File;
  
  const image = await imageService.uploadImage(userId, file, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: image,
  });
});

export const listImages = catchAsync(async (req: Request, res: Response) => {
  const result = await imageService.listImages(req.query as any);
  res.status(200).json({
    success: true,
    message: 'Images retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getImage = catchAsync(async (req: Request, res: Response) => {
  const image = await imageService.getImageById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Image retrieved successfully',
    data: image,
  });
});

export const deleteImage = catchAsync(async (req: Request, res: Response) => {
  await imageService.deleteImage(req.params.id as string);
  res.status(204).send();
});
