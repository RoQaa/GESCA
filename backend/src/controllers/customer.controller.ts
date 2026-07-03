import { Request, Response } from 'express';
import { catchAsync } from '../helpers/catchAsync';
import { customerService } from '../services/customer.service';

export const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.sub;
  const customer = await customerService.createCustomer(userId, req.body);
  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer,
  });
});

export const listCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req.query as any);
  res.status(200).json({
    success: true,
    message: 'Customers retrieved successfully',
    data: result.data,
    meta: {
      nextCursor: result.nextCursor,
    },
  });
});

export const getCustomer = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Customer retrieved successfully',
    data: customer,
  });
});

export const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: customer,
  });
});

export const deleteCustomer = catchAsync(async (req: Request, res: Response) => {
  await customerService.deleteCustomer(req.params.id as string);
  res.status(204).send();
});
