import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn']
});

export async function withPrisma<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  return fn(prisma);
}

export * from '@prisma/client';
