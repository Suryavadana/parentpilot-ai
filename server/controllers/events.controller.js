import { getPrismaClient } from '../lib/prisma.js';

const normalizeEventData = (data) => {
  const eventData = { ...data };

  if (eventData.startDate) {
    const parsedStartDate = new Date(eventData.startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    eventData.startDate = parsedStartDate;
  }

  if (eventData.endDate) {
    const parsedEndDate = new Date(eventData.endDate);

    if (Number.isNaN(parsedEndDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    eventData.endDate = parsedEndDate;
  }

  return eventData;
};

const fetchEventsForFamily = async ({ familyId, childId, category }) => {
  const client = getPrismaClient();

  return client.event.findMany({
    where: {
      familyId,
      ...(childId ? { childId } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { startDate: 'asc' },
    include: {
      child: {
        select: { fullName: true },
      },
    },
  });
};

const getEvents = async (req, res, next) => {
  try {
    const { childId, category } = req.query;
    const events = await fetchEventsForFamily({ familyId: req.familyId, childId, category });

    return res.status(200).json(events);
  } catch (error) {
    return next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const event = await client.event.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    return next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { title, category, startDate, childId, ...rest } = req.body;

    if (!title || !category || !startDate) {
      return res.status(400).json({ error: 'title, category and startDate are required' });
    }

    if (childId) {
      const child = await client.child.findFirst({
        where: { id: childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const eventData = normalizeEventData({
      title,
      category,
      startDate,
      childId,
      ...rest,
      familyId: req.familyId,
    });

    const event = await client.event.create({
      data: eventData,
    });

    return res.status(201).json(event);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'startDate and endDate must be valid dates' });
    }

    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingEvent = await client.event.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const { familyId, ...updateBody } = req.body;
    const data = normalizeEventData({ ...updateBody });

    const event = await client.event.update({
      where: { id },
      data,
    });

    return res.status(200).json(event);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'startDate and endDate must be valid dates' });
    }

    return next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingEvent = await client.event.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await client.event.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }

    return next(error);
  }
};

export {
  fetchEventsForFamily,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
