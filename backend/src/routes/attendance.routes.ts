import { Router } from 'express';
import {
  listAttendances,
  getAttendance,
  logAttendance,
} from '../controllers/attendance.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  logAttendanceSchema,
  getAttendanceSchema,
  listAttendancesSchema,
} from '../validators/attendance.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// List attendances (Admin, Manager, Employee)
router.get(
  '/',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ query: listAttendancesSchema }),
  listAttendances
);

// Get single attendance record
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getAttendanceSchema }),
  getAttendance
);

// Log attendance (Employee)
router.post(
  '/',
  authorize(['SalesEmployee']), // Usually only the employee logs their own attendance
  validate({ body: logAttendanceSchema }),
  logAttendance
);

export const attendanceRoutes = router;
