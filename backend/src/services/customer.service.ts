import { prisma } from '../config/database.config';
import { customerRepository } from '../repositories/customer.repository';
import { AppError } from '../exceptions/AppError';
import { HttpStatus } from '../constants/http-status.constants';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersQuery,
} from '../validators/customer.validator';
import { Prisma } from '@prisma/client';

class CustomerService {
  async createCustomer(userId: string, data: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email || null, // null if empty string
        address: data.address,
        notes: data.notes,
        createdById: userId,
        locations: data.locations && data.locations.length > 0
          ? {
              create: data.locations,
            }
          : undefined,
      },
      include: {
        locations: true,
      },
    });

    return customer;
  }

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { locations: true },
    });

    if (!customer) {
      throw new AppError('Customer not found', HttpStatus.NOT_FOUND);
    }

    return customer;
  }

  async updateCustomer(id: string, data: UpdateCustomerInput) {
    // Ensure exists
    await this.getCustomerById(id);

    return customerRepository.update(id, data);
  }

  async deleteCustomer(id: string) {
    // Ensure exists
    await this.getCustomerById(id);

    // Soft delete
    return customerRepository.update(id, { deletedAt: new Date() });
  }

  async listCustomers(query: ListCustomersQuery) {
    const { limit, cursor, search, isActive } = query;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const customers = await prisma.customer.findMany({
      where,
      take: (limit as number) + 1,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        locations: {
          where: { isPrimary: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (customers.length > (limit as number)) {
      const nextItem = customers.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      data: customers,
      nextCursor,
    };
  }
}

export const customerService = new CustomerService();
