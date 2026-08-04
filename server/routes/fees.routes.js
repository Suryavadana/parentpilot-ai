import express from 'express';
import {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
} from '../controllers/fees.controller.js';

const router = express.Router();

router.get('/', getFees);
router.get('/:id', getFeeById);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

export default router;
