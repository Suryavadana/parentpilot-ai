import { getPrismaClient } from '../lib/prisma.js';
import { calculateUrgency } from '../lib/urgency.js';

const FEE_STATUSES = ['unpaid', 'paid'];

const normalizeFeeData = (data) => {
  const feeData = { ...data };

  if (feeData.dueDate) {
    const parsedDueDate = new Date(feeData.dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    feeData.dueDate = parsedDueDate;
  }

  return feeData;
};

const isValidAmount = (amount) => {
  const parsedAmount = Number(amount);
  return Number.isFinite(parsedAmount) && parsedAmount > 0;
};

const getFees = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const fees = await client.fee.findMany({
      where: {
        child: { familyId: req.familyId },
        ...(childId ? { childId } : {}),
      },
      orderBy: { dueDate: 'asc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    const feesWithUrgency = fees.map((item) => ({
      ...item,
      urgency: calculateUrgency(item.dueDate, item.status, 'paid'),
    }));

    return res.status(200).json(feesWithUrgency);
  } catch (error) {
    return next(error);
  }
};

const getFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const fee = await client.fee.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    return res.status(200).json(fee);
  } catch (error) {
    return next(error);
  }
};

const createFee = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      description, amount, dueDate, childId, status, ...rest
    } = req.body;

    if (!description || !amount || !dueDate || !childId) {
      return res.status(400).json({ error: 'description, amount, dueDate and childId are required' });
    }

    if (!isValidAmount(amount)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (status && !FEE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be "unpaid" or "paid"' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const feeData = normalizeFeeData({
      description,
      amount,
      dueDate,
      childId,
      ...(status ? { status } : {}),
      ...rest,
    });

    const fee = await client.fee.create({
      data: feeData,
    });

    return res.status(201).json(fee);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dueDate must be a valid date' });
    }

    return next(error);
  }
};

const updateFee = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingFee = await client.fee.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingFee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    if (req.body.status && !FEE_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'status must be "unpaid" or "paid"' });
    }

    if (req.body.amount !== undefined && !isValidAmount(req.body.amount)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeFeeData({ ...req.body });

    const fee = await client.fee.update({
      where: { id },
      data,
    });

    return res.status(200).json(fee);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Fee not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dueDate must be a valid date' });
    }

    return next(error);
  }
};

const deleteFee = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingFee = await client.fee.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingFee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    await client.fee.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Fee not found' });
    }

    return next(error);
  }
};

export {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
};
