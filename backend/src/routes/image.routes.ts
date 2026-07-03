import { Router } from 'express';
import {
  listImages,
  getImage,
  uploadImage,
  deleteImage,
} from '../controllers/image.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  uploadImageSchema,
  getImageSchema,
  listImagesSchema,
} from '../validators/image.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// All image routes require authentication
router.use(authenticate);

// List images (Admin, Manager)
router.get(
  '/',
  authorize(['Admin', 'Manager']),
  validate({ query: listImagesSchema }),
  listImages
);

// Get single image metadata
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getImageSchema }),
  getImage
);

// Upload image (Employee)
// We validate body *after* multer parses the multipart/form-data
router.post(
  '/',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  uploadMiddleware.single('image'), // Expect 'image' field in form-data
  validate({ body: uploadImageSchema }),
  uploadImage
);

// Delete image
router.delete(
  '/:id',
  authorize(['Admin', 'Manager']),
  validate({ params: getImageSchema }),
  deleteImage
);

export const imageRoutes = router;
