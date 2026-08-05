import { getPrismaClient } from '../lib/prisma.js';

const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.userRole = user.role;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default requireRole;
