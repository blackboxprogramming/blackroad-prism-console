export * from "./types.js";
export { createInMemoryDb } from "./in-memory.js";

// Prisma binding is provided as a factory to avoid requiring a database for tests.
export { createPrismaComplianceDb } from "./prisma-adapter.js";
