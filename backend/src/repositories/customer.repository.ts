import { Customer, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CustomerRepository extends BaseRepository<
  Customer,
  Prisma.CustomerCreateInput,
  Prisma.CustomerUpdateInput
> {
  constructor() {
    super('customer');
  }

  // Add custom database methods if needed
}

export const customerRepository = new CustomerRepository();
