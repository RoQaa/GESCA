import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';
import { customerRoutes } from './customer.routes';
import { taskRoutes } from './task.routes';
import { visitRoutes } from './visit.routes';
import { attendanceRoutes } from './attendance.routes';
import { reportRoutes } from './report.routes';
import { imageRoutes } from './image.routes';
import { analyticsRoutes } from './analytics.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/customers', customerRoutes);
router.use('/tasks', taskRoutes);
router.use('/visits', visitRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/reports', reportRoutes);
router.use('/images', imageRoutes);
router.use('/analytics', analyticsRoutes);

// More routes will be mounted here
// router.use('/tasks', taskRoutes);

export const apiRoutes = router;
