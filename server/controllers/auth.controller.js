import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../lib/prisma.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

const signToken = (user) => jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: TOKEN_EXPIRY },
);

const signup = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password and fullName are required' });
    }

    const client = getPrismaClient();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await client.user.create({
      data: { email, passwordHash, fullName },
    });

    const token = signToken(user);

    return res.status(201).json({ token });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Email already in use' });
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const client = getPrismaClient();
    const user = await client.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

export {
  signup,
  login,
  me,
};
