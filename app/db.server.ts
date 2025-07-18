import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma client instance for the application.
 * Ensures a single PrismaClient is used across hot reloads in development.
 */
declare global {
  var prismaGlobal: PrismaClient;
}

// In development, reuse the global Prisma client to avoid exhausting database connections
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

// Use the global Prisma client if available, otherwise create a new one
const prisma = global.prismaGlobal ?? new PrismaClient();

/**
 * The Prisma client instance for database access.
 * @type {PrismaClient}
 */
export default prisma;
