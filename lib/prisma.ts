import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && connectionString.startsWith('postgres')) {
    const sql = neon(connectionString);
    const adapter = new PrismaNeonHttp(sql as any, {} as any);
    return new PrismaClient({ adapter: adapter as any });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
