import { Router } from 'express';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerSchema,
  listCustomersSchema,
} from '../validators/customer.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// List customers (Admin, Manager, SalesEmployee)
router.get(
  '/',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ query: listCustomersSchema }),
  listCustomers
);

// Create customer (Admin, Manager, SalesEmployee)
router.post(
  '/',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ body: createCustomerSchema }),
  createCustomer
);

// Get single customer (Admin, Manager, SalesEmployee)
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'SalesEmployee']),
  validate({ params: getCustomerSchema }),
  getCustomer
);

// Update customer (Admin, Manager)
router.patch(
  '/:id',
  authorize(['Admin', 'Manager']),
  validate({ params: getCustomerSchema, body: updateCustomerSchema }),
  updateCustomer
);

// Delete customer (Admin only)
router.delete(
  '/:id',
  authorize(['Admin']),
  validate({ params: getCustomerSchema }),
  deleteCustomer
);

export const customerRoutes = router;
