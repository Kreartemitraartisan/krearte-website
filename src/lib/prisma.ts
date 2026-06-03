// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// ✅ Global type untuk singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ Buat Prisma Client dengan konfigurasi yang aman
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as const // ✅ Gunakan 'as const' untuk type safety
    : ['error'] as const,
  datasources: {
    db: {
      // ✅ Prioritaskan DIRECT_URL untuk hindari pooler
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
});

// ✅ Singleton: Hanya di development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;