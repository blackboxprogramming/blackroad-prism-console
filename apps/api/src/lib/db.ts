import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
export async function getOrCreateUserByEmail(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name }
  });
}
