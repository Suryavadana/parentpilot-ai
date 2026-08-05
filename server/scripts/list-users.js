import 'dotenv/config';
import { getPrismaClient } from '../lib/prisma.js';

const run = async () => {
  const client = getPrismaClient();
  const users = await client.user.findMany({
    select: { email: true, fullName: true, role: true, familyId: true },
  });
  console.log(users);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
