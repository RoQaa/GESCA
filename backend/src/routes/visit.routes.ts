import { Router } from 'express';
import {
  listVisits,
  getVisit,
  updateVisit,
} from '../controllers/visit.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  updateVisitSchema,
  getVisitSchema,
  listVisitsSchema,
} from '../validators/visit.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All visit routes require authentication
router.use(authenticate);

// List visits (Admin, Manager, Employee)
router.get(
  '/',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ query: listVisitsSchema }),
  listVisits
);

// Get single visit
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getVisitSchema }),
  getVisit
);

// Update visit status/notes
router.patch(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getVisitSchema, body: updateVisitSchema }),
  updateVisit
);

export const visitRoutes = router;
