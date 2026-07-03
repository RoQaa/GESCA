import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { validate } from '../middlewares/validate.middleware';
import { getDashboardStatsSchema } from '../validators/analytics.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

router.use(authenticate);

// Get dashboard stats (Admin, Manager, Employee - each sees their scope)
router.get(
  '/dashboard',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ query: getDashboardStatsSchema }),
  getDashboardStats
);

export const analyticsRoutes = router;
