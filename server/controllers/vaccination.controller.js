import { getPrismaClient } from '../lib/prisma.js';

const normalizeVaccinationData = (data) => {
  const vaccinationData = { ...data };

  if (vaccinationData.dateAdministered) {
    const parsedDateAdministered = new Date(vaccinationData.dateAdministered);

    if (Number.isNaN(parsedDateAdministered.getTime())) {
      throw new Error('INVALID_DATE');
    }

    vaccinationData.dateAdministered = parsedDateAdministered;
  }

  if (vaccinationData.nextDueDate) {
    const parsedNextDueDate = new Date(vaccinationData.nextDueDate);

    if (Number.isNaN(parsedNextDueDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    vaccinationData.nextDueDate = parsedNextDueDate;
  }

  if (vaccinationData.doseNumber !== undefined && vaccinationData.doseNumber !== null) {
    const parsedDoseNumber = Number(vaccinationData.doseNumber);

    if (!Number.isInteger(parsedDoseNumber)) {
      throw new Error('INVALID_DOSE_NUMBER');
    }

    vaccinationData.doseNumber = parsedDoseNumber;
  }

  return vaccinationData;
};

const getVaccinations = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const vaccinations = await client.vaccination.findMany({
      where: {
        child: { familyId: req.familyId },
        ...(childId ? { childId } : {}),
      },
      orderBy: { dateAdministered: 'desc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(vaccinations);
  } catch (error) {
    return next(error);
  }
};

const getVaccinationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const vaccination = await client.vaccination.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!vaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    return res.status(200).json(vaccination);
  } catch (error) {
    return next(error);
  }
};

const createVaccination = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      vaccineName, dateAdministered, childId, ...rest
    } = req.body;

    if (!vaccineName || !dateAdministered || !childId) {
      return res.status(400).json({ error: 'vaccineName, dateAdministered and childId are required' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const vaccinationData = normalizeVaccinationData({
      vaccineName,
      dateAdministered,
      childId,
      ...rest,
    });

    const vaccination = await client.vaccination.create({
      data: vaccinationData,
    });

    return res.status(201).json(vaccination);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dateAdministered and nextDueDate must be valid dates' });
    }

    if (error instanceof Error && error.message === 'INVALID_DOSE_NUMBER') {
      return res.status(400).json({ error: 'doseNumber must be an integer' });
    }

    return next(error);
  }
};

const updateVaccination = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingVaccination = await client.vaccination.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingVaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeVaccinationData({ ...req.body });

    const vaccination = await client.vaccination.update({
      where: { id },
      data,
    });

    return res.status(200).json(vaccination);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'dateAdministered and nextDueDate must be valid dates' });
    }

    if (error instanceof Error && error.message === 'INVALID_DOSE_NUMBER') {
      return res.status(400).json({ error: 'doseNumber must be an integer' });
    }

    return next(error);
  }
};

const deleteVaccination = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingVaccination = await client.vaccination.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingVaccination) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    await client.vaccination.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    return next(error);
  }
};

export {
  getVaccinations,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
};
