import { Router } from 'express';
import {
  listTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  listTasksSchema,
} from '../validators/task.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Get employee's own tasks (Employee)
router.get(
  '/my-tasks',
  validate({ query: listTasksSchema }),
  getMyTasks
);

// List all tasks (Admin, Manager)
router.get(
  '/',
  authorize(['Admin', 'Manager']),
  validate({ query: listTasksSchema }),
  listTasks
);

// Create task (Admin, Manager)
router.post(
  '/',
  authorize(['Admin', 'Manager']),
  validate({ body: createTaskSchema }),
  createTask
);

// Get single task (Admin, Manager, Employee)
router.get(
  '/:id',
  validate({ params: getTaskSchema }),
  getTask
);

// Update task (Admin, Manager)
router.patch(
  '/:id',
  authorize(['Admin', 'Manager']),
  validate({ params: getTaskSchema, body: updateTaskSchema }),
  updateTask
);

// Delete task (Admin only)
router.delete(
  '/:id',
  authorize(['Admin']),
  validate({ params: getTaskSchema }),
  deleteTask
);

export const taskRoutes = router;
