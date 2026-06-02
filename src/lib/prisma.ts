// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// ✅ Global type untuk singleton pattern (mencegah multiple instances di dev)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ Konfigurasi Prisma Client
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      // ✅ Prioritaskan DIRECT_URL untuk hindari pooler Supabase
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  // ✅ Optimasi connection pool untuk serverless (Vercel)
  ...(process.env.NODE_ENV === 'production' && {
    datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
  }),
};

// ✅ Singleton: Reuse instance di development, baru instance di production
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

// ✅ Hanya set global di development (hot reload aman)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ✅ Export default untuk convenience
export default prisma;