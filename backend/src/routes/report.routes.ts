import { Router } from 'express';
import {
  listReports,
  getReport,
  createReport,
} from '../controllers/report.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createReportSchema,
  getReportSchema,
  listReportsSchema,
} from '../validators/report.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// List reports (Admin, Manager)
router.get(
  '/',
  authorize(['Admin', 'Manager']),
  validate({ query: listReportsSchema }),
  listReports
);

// Get single report
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getReportSchema }),
  getReport
);

// Create report (Employee)
router.post(
  '/',
  authorize(['SalesEmployee']),
  validate({ body: createReportSchema }),
  createReport
);

export const reportRoutes = router;
