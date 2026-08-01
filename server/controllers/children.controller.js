import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

let prisma = null;

const getPrismaClient = () => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL must be set');
    }

    if (connectionString.startsWith('prisma+postgres://')) {
      throw new Error('DATABASE_URL must be a direct Postgres connection string, not a prisma+postgres:// proxy URL. Use the direct URL from `npx prisma dev`.');
    }

    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
};

const normalizeChildData = (data) => {
  const childData = { ...data };

  if (childData.dateOfBirth) {
    const parsedDate = new Date(childData.dateOfBirth);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    childData.dateOfBirth = parsedDate;
  }

  return childData;
};

const getChildren = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const children = await client.child.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(children);
  } catch (error) {
    return next(error);
  }
};

const getChildById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const child = await client.child.findUnique({
      where: { id },
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    return res.status(200).json(child);
  } catch (error) {
    return next(error);
  }
};

const createChild = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { fullName, dateOfBirth, ...rest } = req.body;

    if (!fullName || !dateOfBirth) {
      return res.status(400).json({ error: 'fullName and dateOfBirth are required' });
    }

    const childData = normalizeChildData({
      fullName,
      dateOfBirth,
      ...rest,
    });

    const child = await client.child.create({
      data: childData,
    });

    return res.status(201).json(child);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dateOfBirth must be a valid date' });
    }

    return next(error);
  }
};

const updateChild = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const data = normalizeChildData({ ...req.body });

    const child = await client.child.update({
      where: { id },
      data,
    });

    return res.status(200).json(child);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dateOfBirth must be a valid date' });
    }

    return next(error);
  }
};

const deleteChild = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    await client.child.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Child not found' });
    }

    return next(error);
  }
};

export {
  getChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
};
