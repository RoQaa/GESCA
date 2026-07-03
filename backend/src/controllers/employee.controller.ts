import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import { catchAsync } from '../helpers/catchAsync';

export const listEmployees = catchAsync(async (req: Request, res: Response) => {
  const result = await employeeService.listEmployees(req.query as any);
  res.status(200).json({
    success: true,
    message: 'Employees retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const getEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployeeById(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Employee retrieved successfully',
    data: employee,
  });
});

export const createEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: employee,
  });
});

export const updateEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.updateEmployee(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: employee,
  });
});

export const deleteEmployee = catchAsync(async (req: Request, res: Response) => {
  await employeeService.deleteEmployee(req.params.id as string);
  res.status(204).send();
});
