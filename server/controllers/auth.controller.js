import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../lib/prisma.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';
const INVITE_TOKEN_EXPIRY = '7d';
const INVITABLE_ROLES = ['parent', 'caregiver'];

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

    const user = await client.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: { name: `${fullName}'s Family` },
      });

      return tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: 'owner',
          familyId: family.id,
        },
      });
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
        familyId: true,
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

const createInvite = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!INVITABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: 'role must be "parent" or "caregiver"' });
    }

    const client = getPrismaClient();
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'owner') {
      return res.status(403).json({ error: 'Only family owners can create invites' });
    }

    const inviteToken = jwt.sign(
      { familyId: req.familyId, role },
      process.env.JWT_SECRET,
      { expiresIn: INVITE_TOKEN_EXPIRY },
    );

    return res.status(201).json({ inviteToken });
  } catch (error) {
    return next(error);
  }
};

const joinFamily = async (req, res, next) => {
  try {
    const {
      inviteToken, email, password, fullName,
    } = req.body;

    if (!inviteToken || !email || !password || !fullName) {
      return res.status(400).json({ error: 'inviteToken, email, password and fullName are required' });
    }

    let invitePayload;

    try {
      invitePayload = jwt.verify(inviteToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    const client = getPrismaClient();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await client.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: invitePayload.role,
        familyId: invitePayload.familyId,
      },
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

export {
  signup,
  login,
  me,
  createInvite,
  joinFamily,
};
