import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  let dbUrl: string | undefined = undefined;

  // On Vercel serverless functions, the root directory (/var/task) is read-only.
  // We copy the database to /tmp/dev.db and pass the explicit URL to PrismaClient to enable full write access.
  if (process.env.VERCEL) {
    try {
      const rootDb = path.join(process.cwd(), "dev.db");
      const prismaDb = path.join(process.cwd(), "prisma", "dev.db");
      const tmpDb = "/tmp/dev.db";

      if (!fs.existsSync(tmpDb)) {
        if (fs.existsSync(prismaDb)) {
          fs.copyFileSync(prismaDb, tmpDb);
        } else if (fs.existsSync(rootDb)) {
          fs.copyFileSync(rootDb, tmpDb);
        }
      }
      dbUrl = "file:/tmp/dev.db";
    } catch (e) {
      console.warn("Vercel SQLite sync notice:", e);
    }
  }

  return new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
