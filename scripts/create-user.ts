import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating user...');

  const email = 'admin@krearte.com';
  const password = 'admin123'; // CHANGE THIS!
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ User created!');
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());