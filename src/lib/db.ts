import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3");
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3(new Database(dbPath)),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
