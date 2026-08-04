import express from 'express';
import {
  getVaccinations,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
} from '../controllers/vaccination.controller.js';

const router = express.Router();

router.get('/', getVaccinations);
router.get('/:id', getVaccinationById);
router.post('/', createVaccination);
router.put('/:id', updateVaccination);
router.delete('/:id', deleteVaccination);

export default router;
