import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// If running in Vercel serverless environment and using SQLite, ensure /tmp/dev.db has write access
if (process.env.VERCEL) {
  try {
    const srcDb = path.join(process.cwd(), "dev.db");
    const tmpDb = "/tmp/dev.db";
    if (fs.existsSync(srcDb) && !fs.existsSync(tmpDb)) {
      fs.copyFileSync(srcDb, tmpDb);
    }
    process.env.DATABASE_URL = "file:/tmp/dev.db";
  } catch (e) {
    console.warn("Vercel SQLite sync notice:", e);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
