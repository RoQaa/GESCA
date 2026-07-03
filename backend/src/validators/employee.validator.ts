import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  roleName: z.enum(['Admin', 'Manager', 'SalesEmployee']).default('SalesEmployee'),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  roleName: z.enum(['Admin', 'Manager', 'SalesEmployee']).optional(),
});

export const getEmployeeSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
});

export const listEmployeesSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.enum(['Admin', 'Manager', 'SalesEmployee']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>;
