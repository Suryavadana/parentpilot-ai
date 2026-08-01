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

const getEvents = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const events = await client.event.findMany({
      where: childId ? { childId } : undefined,
      orderBy: { startDate: 'asc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(events);
  } catch (error) {
    return next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const event = await client.event.findUnique({
      where: { id },
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
    const { title, category, startDate, ...rest } = req.body;

    if (!title || !category || !startDate) {
      return res.status(400).json({ error: 'title, category and startDate are required' });
    }

    const eventData = normalizeEventData({
      title,
      category,
      startDate,
      ...rest,
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

    const data = normalizeEventData({ ...req.body });

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
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
