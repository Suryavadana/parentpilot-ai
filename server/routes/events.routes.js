import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controller.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
