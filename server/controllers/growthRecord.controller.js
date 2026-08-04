import { getPrismaClient } from '../lib/prisma.js';

const normalizeGrowthRecordData = (data) => {
  const growthRecordData = { ...data };

  if (growthRecordData.date) {
    const parsedDate = new Date(growthRecordData.date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    growthRecordData.date = parsedDate;
  }

  if (growthRecordData.heightCm !== undefined && growthRecordData.heightCm !== null) {
    const parsedHeightCm = Number(growthRecordData.heightCm);

    if (Number.isNaN(parsedHeightCm)) {
      throw new Error('INVALID_MEASUREMENT');
    }

    growthRecordData.heightCm = parsedHeightCm;
  }

  if (growthRecordData.weightKg !== undefined && growthRecordData.weightKg !== null) {
    const parsedWeightKg = Number(growthRecordData.weightKg);

    if (Number.isNaN(parsedWeightKg)) {
      throw new Error('INVALID_MEASUREMENT');
    }

    growthRecordData.weightKg = parsedWeightKg;
  }

  return growthRecordData;
};

const hasAMeasurement = (heightCm, weightKg) => (
  (heightCm !== undefined && heightCm !== null && heightCm !== '')
  || (weightKg !== undefined && weightKg !== null && weightKg !== '')
);

const getGrowthRecords = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const growthRecords = await client.growthRecord.findMany({
      where: {
        child: { familyId: req.familyId },
        ...(childId ? { childId } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(growthRecords);
  } catch (error) {
    return next(error);
  }
};

const getGrowthRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const growthRecord = await client.growthRecord.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!growthRecord) {
      return res.status(404).json({ error: 'Growth record not found' });
    }

    return res.status(200).json(growthRecord);
  } catch (error) {
    return next(error);
  }
};

const createGrowthRecord = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      date, childId, heightCm, weightKg, ...rest
    } = req.body;

    if (!date || !childId) {
      return res.status(400).json({ error: 'date and childId are required' });
    }

    if (!hasAMeasurement(heightCm, weightKg)) {
      return res.status(400).json({ error: 'At least one of heightCm or weightKg is required' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const growthRecordData = normalizeGrowthRecordData({
      date,
      childId,
      ...(heightCm !== undefined ? { heightCm } : {}),
      ...(weightKg !== undefined ? { weightKg } : {}),
      ...rest,
    });

    const growthRecord = await client.growthRecord.create({
      data: growthRecordData,
    });

    return res.status(201).json(growthRecord);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'date must be a valid date' });
    }

    if (error instanceof Error && error.message === 'INVALID_MEASUREMENT') {
      return res.status(400).json({ error: 'heightCm and weightKg must be numbers' });
    }

    return next(error);
  }
};

const updateGrowthRecord = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingGrowthRecord = await client.growthRecord.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingGrowthRecord) {
      return res.status(404).json({ error: 'Growth record not found' });
    }

    const nextHeightCm = 'heightCm' in req.body ? req.body.heightCm : existingGrowthRecord.heightCm;
    const nextWeightKg = 'weightKg' in req.body ? req.body.weightKg : existingGrowthRecord.weightKg;

    if (!hasAMeasurement(nextHeightCm, nextWeightKg)) {
      return res.status(400).json({ error: 'At least one of heightCm or weightKg is required' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeGrowthRecordData({ ...req.body });

    const growthRecord = await client.growthRecord.update({
      where: { id },
      data,
    });

    return res.status(200).json(growthRecord);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Growth record not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'date must be a valid date' });
    }

    if (error instanceof Error && error.message === 'INVALID_MEASUREMENT') {
      return res.status(400).json({ error: 'heightCm and weightKg must be numbers' });
    }

    return next(error);
  }
};

const deleteGrowthRecord = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingGrowthRecord = await client.growthRecord.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingGrowthRecord) {
      return res.status(404).json({ error: 'Growth record not found' });
    }

    await client.growthRecord.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Growth record not found' });
    }

    return next(error);
  }
};

export {
  getGrowthRecords,
  getGrowthRecordById,
  createGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
};
