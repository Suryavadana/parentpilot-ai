import { getPrismaClient } from '../lib/prisma.js';

const attachFamily = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: { familyId: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.familyId = user.familyId;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default attachFamily;
