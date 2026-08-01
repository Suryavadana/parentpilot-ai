import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

let prisma = null;

const getPrismaClient = () => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL must be set');
    }

    if (connectionString.startsWith('prisma+postgres://')) {
      throw new Error('DATABASE_URL must be a direct Postgres connection string, not a prisma+postgres:// proxy URL. Use the direct URL from `npx prisma dev`.');
    }

    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
};

export { getPrismaClient };
