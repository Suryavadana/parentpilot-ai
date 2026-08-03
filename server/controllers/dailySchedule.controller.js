import { getPrismaClient } from '../lib/prisma.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidDayOfWeek = (dayOfWeek) => {
  const parsedDay = Number(dayOfWeek);
  return Number.isInteger(parsedDay) && parsedDay >= 0 && parsedDay <= 6;
};

const isValidTime = (time) => typeof time === 'string' && TIME_PATTERN.test(time);

const getDailySchedule = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const dailySchedule = await client.dailySchedule.findMany({
      where: {
        child: { familyId: req.familyId },
        ...(childId ? { childId } : {}),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(dailySchedule);
  } catch (error) {
    return next(error);
  }
};

const getDailyScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const dailyScheduleEntry = await client.dailySchedule.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!dailyScheduleEntry) {
      return res.status(404).json({ error: 'Daily schedule entry not found' });
    }

    return res.status(200).json(dailyScheduleEntry);
  } catch (error) {
    return next(error);
  }
};

const createDailySchedule = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      dayOfWeek, startTime, endTime, subject, childId, ...rest
    } = req.body;

    if (
      dayOfWeek === undefined
      || dayOfWeek === null
      || !startTime
      || !endTime
      || !subject
      || !childId
    ) {
      return res.status(400).json({ error: 'dayOfWeek, startTime, endTime, subject and childId are required' });
    }

    if (!isValidDayOfWeek(dayOfWeek)) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)' });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ error: 'startTime and endTime must be in "HH:MM" format' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const dailyScheduleEntry = await client.dailySchedule.create({
      data: {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        subject,
        childId,
        ...rest,
      },
    });

    return res.status(201).json(dailyScheduleEntry);
  } catch (error) {
    return next(error);
  }
};

const updateDailySchedule = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingEntry = await client.dailySchedule.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Daily schedule entry not found' });
    }

    if (req.body.dayOfWeek !== undefined && !isValidDayOfWeek(req.body.dayOfWeek)) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)' });
    }

    if (req.body.startTime !== undefined && !isValidTime(req.body.startTime)) {
      return res.status(400).json({ error: 'startTime must be in "HH:MM" format' });
    }

    if (req.body.endTime !== undefined && !isValidTime(req.body.endTime)) {
      return res.status(400).json({ error: 'endTime must be in "HH:MM" format' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = { ...req.body };

    if (data.dayOfWeek !== undefined) {
      data.dayOfWeek = Number(data.dayOfWeek);
    }

    const dailyScheduleEntry = await client.dailySchedule.update({
      where: { id },
      data,
    });

    return res.status(200).json(dailyScheduleEntry);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Daily schedule entry not found' });
    }

    return next(error);
  }
};

const deleteDailySchedule = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingEntry = await client.dailySchedule.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Daily schedule entry not found' });
    }

    await client.dailySchedule.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Daily schedule entry not found' });
    }

    return next(error);
  }
};

export {
  getDailySchedule,
  getDailyScheduleById,
  createDailySchedule,
  updateDailySchedule,
  deleteDailySchedule,
};
