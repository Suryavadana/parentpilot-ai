import { getPrismaClient } from '../lib/prisma.js';

const FEEDBACK_CATEGORIES = ['academic', 'behavioral', 'health', 'general'];

const normalizeFeedbackData = (data) => {
  const feedbackData = { ...data };

  if (feedbackData.date) {
    const parsedDate = new Date(feedbackData.date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    feedbackData.date = parsedDate;
  }

  return feedbackData;
};

const getFeedback = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId, category } = req.query;

    const feedback = await client.feedback.findMany({
      where: {
        child: { familyId: req.familyId },
        ...(childId ? { childId } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(feedback);
  } catch (error) {
    return next(error);
  }
};

const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const feedback = await client.feedback.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    return res.status(200).json(feedback);
  } catch (error) {
    return next(error);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      source, category, content, date, childId, ...rest
    } = req.body;

    if (!source || !category || !content || !date || !childId) {
      return res.status(400).json({ error: 'source, category, content, date and childId are required' });
    }

    if (!FEEDBACK_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'category must be "academic", "behavioral", "health" or "general"' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const feedbackData = normalizeFeedbackData({
      source,
      category,
      content,
      date,
      childId,
      ...rest,
    });

    const feedback = await client.feedback.create({
      data: feedbackData,
    });

    return res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'date must be a valid date' });
    }

    return next(error);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingFeedback = await client.feedback.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (req.body.category && !FEEDBACK_CATEGORIES.includes(req.body.category)) {
      return res.status(400).json({ error: 'category must be "academic", "behavioral", "health" or "general"' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeFeedbackData({ ...req.body });

    const feedback = await client.feedback.update({
      where: { id },
      data,
    });

    return res.status(200).json(feedback);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'date must be a valid date' });
    }

    return next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingFeedback = await client.feedback.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await client.feedback.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    return next(error);
  }
};

export {
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
