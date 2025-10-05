import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export type {
  RegEvent,
  Filing,
  DeliveryLog,
  Rulepack,
  Gate,
  WormBlock,
  Prisma
} from '@prisma/client';

export default prisma;
