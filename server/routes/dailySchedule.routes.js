import express from 'express';
import {
  getDailySchedule,
  getDailyScheduleById,
  createDailySchedule,
  updateDailySchedule,
  deleteDailySchedule,
} from '../controllers/dailySchedule.controller.js';

const router = express.Router();

router.get('/', getDailySchedule);
router.get('/:id', getDailyScheduleById);
router.post('/', createDailySchedule);
router.put('/:id', updateDailySchedule);
router.delete('/:id', deleteDailySchedule);

export default router;
