import type { PrismaClient } from "@prisma/client";

let prismaPromise: Promise<PrismaClient> | undefined;

export function loadPrismaClient(): Promise<PrismaClient> {
  if (!prismaPromise) {
    prismaPromise = import("@prisma/client").then(({ PrismaClient }) => {
      const client = new PrismaClient();
      return client;
    });
  }
  return prismaPromise;
}
