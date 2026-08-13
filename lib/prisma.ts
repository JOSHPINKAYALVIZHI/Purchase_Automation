import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  if (process.env.VERCEL) {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const tmpPath = '/tmp/dev.db';
    if (fs.existsSync(dbPath) && !fs.existsSync(tmpPath)) {
      try {
        fs.copyFileSync(dbPath, tmpPath);
        process.env.DATABASE_URL = 'file:/tmp/dev.db';
      } catch (e) {}
    }
  }

  return new PrismaClient({
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
