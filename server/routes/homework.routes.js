import express from 'express';
import {
  getHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../controllers/homework.controller.js';

const router = express.Router();

router.get('/', getHomework);
router.get('/:id', getHomeworkById);
router.post('/', createHomework);
router.put('/:id', updateHomework);
router.delete('/:id', deleteHomework);

export default router;
