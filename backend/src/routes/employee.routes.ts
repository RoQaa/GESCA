import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeSchema,
  listEmployeesSchema,
} from '../validators/employee.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All employee routes require authentication
router.use(authenticate);

// List employees (Admin, Manager)
router.get(
  '/',
  authorize(['Admin', 'Manager']),
  validate({ query: listEmployeesSchema }),
  listEmployees
);

// Create employee (Admin only)
router.post(
  '/',
  authorize(['Admin']),
  validate({ body: createEmployeeSchema }),
  createEmployee
);

// Get single employee (Admin, Manager)
router.get(
  '/:id',
  authorize(['Admin', 'Manager']),
  validate({ params: getEmployeeSchema }),
  getEmployee
);

// Update employee (Admin only)
router.patch(
  '/:id',
  authorize(['Admin']),
  validate({ params: getEmployeeSchema, body: updateEmployeeSchema }),
  updateEmployee
);

// Delete employee (Admin only)
router.delete(
  '/:id',
  authorize(['Admin']),
  validate({ params: getEmployeeSchema }),
  deleteEmployee
);

export const employeeRoutes = router;
