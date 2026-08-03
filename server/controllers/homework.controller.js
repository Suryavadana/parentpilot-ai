import { getPrismaClient } from '../lib/prisma.js';
import { calculateUrgency } from '../lib/urgency.js';

const HOMEWORK_STATUSES = ['not_started', 'in_progress', 'done'];

const normalizeHomeworkData = (data) => {
  const homeworkData = { ...data };

  if (homeworkData.dueDate) {
    const parsedDueDate = new Date(homeworkData.dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    homeworkData.dueDate = parsedDueDate;
  }

  return homeworkData;
};

const getHomework = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const homework = await client.homework.findMany({
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

    const homeworkWithUrgency = homework.map((item) => ({
      ...item,
      urgency: calculateUrgency(item.dueDate, item.status, 'done'),
    }));

    return res.status(200).json(homeworkWithUrgency);
  } catch (error) {
    return next(error);
  }
};

const getHomeworkById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const homework = await client.homework.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return res.status(200).json(homework);
  } catch (error) {
    return next(error);
  }
};

const createHomework = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      title, subject, dueDate, childId, status, ...rest
    } = req.body;

    if (!title || !subject || !dueDate || !childId) {
      return res.status(400).json({ error: 'title, subject, dueDate and childId are required' });
    }

    if (status && !HOMEWORK_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be "not_started", "in_progress" or "done"' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const homeworkData = normalizeHomeworkData({
      title,
      subject,
      dueDate,
      childId,
      ...(status ? { status } : {}),
      ...rest,
    });

    const homework = await client.homework.create({
      data: homeworkData,
    });

    return res.status(201).json(homework);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dueDate must be a valid date' });
    }

    return next(error);
  }
};

const updateHomework = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingHomework = await client.homework.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingHomework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    if (req.body.status && !HOMEWORK_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'status must be "not_started", "in_progress" or "done"' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeHomeworkData({ ...req.body });

    const homework = await client.homework.update({
      where: { id },
      data,
    });

    return res.status(200).json(homework);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Homework not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dueDate must be a valid date' });
    }

    return next(error);
  }
};

const deleteHomework = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingHomework = await client.homework.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingHomework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    await client.homework.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return next(error);
  }
};

export {
  getHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
};
