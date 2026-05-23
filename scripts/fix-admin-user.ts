import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Updating admin password...');

  const email = 'admin@krearte.com';
  const plainPassword = 'admin123';
  
  // Generate bcrypt hash
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  console.log('Generated hash:', hashedPassword);

  // Cek apakah user sudah ada
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser) {
    // ✅ Update: pakai { data: {...} }
    await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        role: 'admin',
        name: existingUser.name || 'Admin User',
      },
    });
    console.log(`✅ Updated existing user: ${email}`);
  } else {
    // ✅ Create: pakai { data: {...} }
    await prisma.user.create({
      data: {
        email: email,
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log(`✅ Created new user: ${email}`);
  }

  // Verify
  const user = await prisma.user.findUnique({
    where: { email: email },
    select: { password: true },
  });

  const isValid = await bcrypt.compare(plainPassword, user?.password || '');
  console.log(`\n🔐 Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log('⚠️  Try login again at /login');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());