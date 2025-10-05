import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function withPrisma<T>(handler: (client: PrismaClient) => Promise<T>): Promise<T> {
  return handler(prisma);
}

export type { PrismaClient };

