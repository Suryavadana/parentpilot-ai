import express from 'express';
import {
  getChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
} from '../controllers/children.controller.js';

const router = express.Router();

router.get('/', getChildren);
router.get('/:id', getChildById);
router.post('/', createChild);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);

export default router;
