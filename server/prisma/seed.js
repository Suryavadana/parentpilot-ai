import 'dotenv/config';
import bcrypt from 'bcrypt';
import { getPrismaClient } from '../lib/prisma.js';

const SALT_ROUNDS = 10;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const main = async () => {
  const prisma = getPrismaClient();

  const family = await prisma.family.upsert({
    where: { id: 'seed-family' },
    update: {},
    create: {
      id: 'seed-family',
      name: 'Test Family',
    },
  });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      email: TEST_EMAIL,
      passwordHash,
      fullName: 'Test Owner',
      role: 'owner',
      familyId: family.id,
    },
  });

  const child = await prisma.child.upsert({
    where: { id: 'seed-child' },
    update: {},
    create: {
      id: 'seed-child',
      fullName: 'Test Child',
      dateOfBirth: new Date('2018-01-01'),
      familyId: family.id,
    },
  });

  console.log('Seeded:', {
    family: family.name,
    user: user.email,
    child: child.fullName,
  });
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
