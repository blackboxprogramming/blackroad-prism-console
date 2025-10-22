export const prisma: any = {
  partner: {
    create: async ({ data }: any) => ({ id: 'p', ...data })
  },
  partnerApp: {
    create: async ({ data }: any) => ({ id: 'a', ...data }),
    update: async ({ where, data }: any) => ({ id: where.id, ...data }),
    findMany: async () => [],
    findFirst: async () => null
  },
  appInstall: {
    create: async ({ data }: any) => ({ id: 'i', ...data }),
    update: async ({ where, data }: any) => ({ id: where.id, ...data })
  },
  oAuthToken: {
    create: async ({ data }: any) => ({ id: 't', ...data }),
    delete: async () => ({})
  }
};
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
export async function getOrCreateUserByEmail(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name }
  });
}
