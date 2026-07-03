import { z } from 'zod';

export const createCustomerLocationSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateCustomerLocationSchema = createCustomerLocationSchema.partial();

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  locations: z.array(createCustomerLocationSchema).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const getCustomerSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
});

export const listCustomersSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  cursor: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateCustomerLocationInput = z.infer<typeof createCustomerLocationSchema>;
export type UpdateCustomerLocationInput = z.infer<typeof updateCustomerLocationSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersSchema>;
