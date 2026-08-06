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

// Deletes a user from a family that will keep existing afterwards, i.e. the
// family and its data are left untouched. Document.uploadedByUserId is a
// required foreign key, so documents the user authored are reassigned to
// another remaining member first — otherwise the delete would be rejected.
// Callers are responsible for guaranteeing another member exists.
const removeUserKeepingFamily = async (tx, familyId, targetUserId) => {
  const anotherMember = await tx.user.findFirst({
    where: { familyId, id: { not: targetUserId } },
    select: { id: true },
  });

  await tx.document.updateMany({
    where: { uploadedByUserId: targetUserId },
    data: { uploadedByUserId: anotherMember.id },
  });

  await tx.user.delete({ where: { id: targetUserId } });
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }

    const client = getPrismaClient();
    const user = await client.user.findUnique({ where: { id: req.user.userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const familyMemberCount = await client.user.count({ where: { familyId: user.familyId } });
    const isLastFamilyMember = familyMemberCount === 1;

    if (user.role === 'owner' && !isLastFamilyMember) {
      return res.status(400).json({
        error: 'Transfer ownership or remove other family members first',
      });
    }

    if (!isLastFamilyMember) {
      // Other family members remain — only this user's own account goes;
      // the rest of the family's data is untouched.
      await client.$transaction((tx) => removeUserKeepingFamily(tx, user.familyId, user.id));

      return res.status(200).json({ deleted: 'user' });
    }

    // This user is the family's last remaining member — tear down the
    // whole family, not just the account. None of these relations cascade
    // at the database level (see schema.prisma), so dependent rows have to
    // be deleted in FK order before the rows they reference: child-scoped
    // records before their Child, then family-scoped records, the user,
    // and finally the Family itself.
    await client.$transaction(async (tx) => {
      const children = await tx.child.findMany({
        where: { familyId: user.familyId },
        select: { id: true },
      });
      const childIds = children.map((child) => child.id);

      await tx.document.deleteMany({ where: { familyId: user.familyId } });

      if (childIds.length > 0) {
        await tx.homework.deleteMany({ where: { childId: { in: childIds } } });
        await tx.fee.deleteMany({ where: { childId: { in: childIds } } });
        await tx.dailySchedule.deleteMany({ where: { childId: { in: childIds } } });
        await tx.activity.deleteMany({ where: { childId: { in: childIds } } });
        await tx.medication.deleteMany({ where: { childId: { in: childIds } } });
        await tx.appointment.deleteMany({ where: { childId: { in: childIds } } });
        await tx.vaccination.deleteMany({ where: { childId: { in: childIds } } });
        await tx.growthRecord.deleteMany({ where: { childId: { in: childIds } } });
        await tx.feedback.deleteMany({ where: { childId: { in: childIds } } });
      }

      await tx.doctor.deleteMany({ where: { familyId: user.familyId } });
      await tx.event.deleteMany({ where: { familyId: user.familyId } });
      await tx.child.deleteMany({ where: { familyId: user.familyId } });
      await tx.user.delete({ where: { id: user.id } });
      await tx.family.delete({ where: { id: user.familyId } });
    });

    return res.status(200).json({ deleted: 'family' });
  } catch (error) {
    return next(error);
  }
};

const listFamilyMembers = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const members = await client.user.findMany({
      where: { familyId: req.familyId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Include the requesting owner in their own roster rather than filtering
    // them out — simpler to reason about than a second, member-count-minus-
    // one code path, and the isSelf flag lets the UI label "(you)" instead.
    const membersWithSelfFlag = members.map((member) => ({
      ...member,
      isSelf: member.id === req.user.userId,
    }));

    return res.status(200).json(membersWithSelfFlag);
  } catch (error) {
    return next(error);
  }
};

const removeFamilyMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({
        error: 'Use DELETE /api/auth/me to remove your own account instead',
      });
    }

    const client = getPrismaClient();
    const targetUser = await client.user.findFirst({
      where: { id: userId, familyId: req.familyId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in this family' });
    }

    await client.$transaction((tx) => removeUserKeepingFamily(tx, req.familyId, targetUser.id));

    return res.status(200).json({ deleted: 'user' });
  } catch (error) {
    return next(error);
  }
};

export {
  signup,
  login,
  me,
  createInvite,
  joinFamily,
  deleteAccount,
  listFamilyMembers,
  removeFamilyMember,
};
