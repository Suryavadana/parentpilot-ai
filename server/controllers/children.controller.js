import { getPrismaClient } from '../lib/prisma.js';

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

const fetchChildrenForFamily = async ({ familyId }) => {
  const client = getPrismaClient();

  return client.child.findMany({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
  });
};

const getChildren = async (req, res, next) => {
  try {
    const children = await fetchChildrenForFamily({ familyId: req.familyId });

    return res.status(200).json(children);
  } catch (error) {
    return next(error);
  }
};

const getChildById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const child = await client.child.findFirst({
      where: { id, familyId: req.familyId },
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
    const { fullName, dateOfBirth, familyId, ...rest } = req.body;

    if (!fullName || !dateOfBirth) {
      return res.status(400).json({ error: 'fullName and dateOfBirth are required' });
    }

    const childData = normalizeChildData({
      fullName,
      dateOfBirth,
      ...rest,
      familyId: req.familyId,
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

    const existingChild = await client.child.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingChild) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const { familyId, ...rest } = req.body;
    const data = normalizeChildData(rest);

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

    const existingChild = await client.child.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingChild) {
      return res.status(404).json({ error: 'Child not found' });
    }

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
  fetchChildrenForFamily,
  getChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
};
