import express from 'express';
import {
  getGrowthRecords,
  getGrowthRecordById,
  createGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
} from '../controllers/growthRecord.controller.js';

const router = express.Router();

router.get('/', getGrowthRecords);
router.get('/:id', getGrowthRecordById);
router.post('/', createGrowthRecord);
router.put('/:id', updateGrowthRecord);
router.delete('/:id', deleteGrowthRecord);

export default router;
