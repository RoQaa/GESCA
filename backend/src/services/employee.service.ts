import { prisma } from '../config/database.config';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../exceptions/AppError';
import { CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesQuery } from '../validators/employee.validator';
import { passwordService } from './password.service';

export class EmployeeService {
  async listEmployees(query: ListEmployeesQuery) {
    const { limit = 20, cursor, search, status, role } = query;

    const where: any = {
      deletedAt: null, // Don't return soft-deleted employees
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    const employees = await prisma.user.findMany({
      where,
      take: (limit as number) + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        roles: {
          include: { role: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (employees.length > (limit as number)) {
      const nextItem = employees.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: employees,
      pagination: {
        nextCursor,
        limit,
      },
    };
  }

  async getEmployeeById(id: string) {
    const employee = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        roles: {
          include: { role: true },
        },
        teamMembership: {
          include: { team: true },
        },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return employee;
  }

  async createEmployee(data: CreateEmployeeInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) {
      throw new AppError(`Role ${data.roleName} not found. Please seed the database.`, 400);
    }

    const passwordHash = await passwordService.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        status: 'ACTIVE',
        isEmailVerified: true, // Assuming admins create verified accounts
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    return user;
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    const employee = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const updateData: any = { ...data };
    
    // Handle role update
    if (data.roleName) {
      const role = await prisma.role.findUnique({ where: { name: data.roleName } });
      if (!role) throw new AppError(`Role ${data.roleName} not found`, 400);

      // Delete existing roles and assign the new one
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.create({
        data: { userId: id, roleId: role.id },
      });
      delete updateData.roleName;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    return updated;
  }

  async deleteEmployee(id: string) {
    const employee = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }
}

export const employeeService = new EmployeeService();
