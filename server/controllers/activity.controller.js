import { getPrismaClient } from '../lib/prisma.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidDayOfWeek = (dayOfWeek) => {
  const parsedDay = Number(dayOfWeek);
  return Number.isInteger(parsedDay) && parsedDay >= 0 && parsedDay <= 6;
};

const isValidTime = (time) => typeof time === 'string' && TIME_PATTERN.test(time);

const getActivities = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const activities = await client.activity.findMany({
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

    return res.status(200).json(activities);
  } catch (error) {
    return next(error);
  }
};

const getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const activity = await client.activity.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return res.status(200).json(activity);
  } catch (error) {
    return next(error);
  }
};

const createActivity = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      name, childId, dayOfWeek, startTime, endTime, ...rest
    } = req.body;

    if (!name || !childId) {
      return res.status(400).json({ error: 'name and childId are required' });
    }

    if (dayOfWeek !== undefined && dayOfWeek !== null && !isValidDayOfWeek(dayOfWeek)) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)' });
    }

    if (startTime !== undefined && startTime !== null && !isValidTime(startTime)) {
      return res.status(400).json({ error: 'startTime must be in "HH:MM" format' });
    }

    if (endTime !== undefined && endTime !== null && !isValidTime(endTime)) {
      return res.status(400).json({ error: 'endTime must be in "HH:MM" format' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const activity = await client.activity.create({
      data: {
        name,
        childId,
        ...(dayOfWeek !== undefined && dayOfWeek !== null ? { dayOfWeek: Number(dayOfWeek) } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...rest,
      },
    });

    return res.status(201).json(activity);
  } catch (error) {
    return next(error);
  }
};

const updateActivity = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingActivity = await client.activity.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (
      req.body.dayOfWeek !== undefined
      && req.body.dayOfWeek !== null
      && !isValidDayOfWeek(req.body.dayOfWeek)
    ) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)' });
    }

    if (
      req.body.startTime !== undefined
      && req.body.startTime !== null
      && !isValidTime(req.body.startTime)
    ) {
      return res.status(400).json({ error: 'startTime must be in "HH:MM" format' });
    }

    if (
      req.body.endTime !== undefined
      && req.body.endTime !== null
      && !isValidTime(req.body.endTime)
    ) {
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

    if (data.dayOfWeek !== undefined && data.dayOfWeek !== null) {
      data.dayOfWeek = Number(data.dayOfWeek);
    }

    const activity = await client.activity.update({
      where: { id },
      data,
    });

    return res.status(200).json(activity);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return next(error);
  }
};

const deleteActivity = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingActivity = await client.activity.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await client.activity.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return next(error);
  }
};

export {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
};
