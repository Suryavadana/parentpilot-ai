import { getPrismaClient } from '../lib/prisma.js';

const normalizeMedicationData = (data) => {
  const medicationData = { ...data };

  if (medicationData.startDate) {
    const parsedStartDate = new Date(medicationData.startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    medicationData.startDate = parsedStartDate;
  }

  if (medicationData.endDate) {
    const parsedEndDate = new Date(medicationData.endDate);

    if (Number.isNaN(parsedEndDate.getTime())) {
      throw new Error('INVALID_DATE');
    }

    medicationData.endDate = parsedEndDate;
  }

  return medicationData;
};

const fetchMedicationsForFamily = async ({ familyId, childId }) => {
  const client = getPrismaClient();

  return client.medication.findMany({
    where: {
      child: { familyId },
      ...(childId ? { childId } : {}),
    },
    orderBy: { startDate: 'desc' },
    include: {
      child: {
        select: { fullName: true },
      },
    },
  });
};

const getMedications = async (req, res, next) => {
  try {
    const { childId } = req.query;
    const medications = await fetchMedicationsForFamily({ familyId: req.familyId, childId });

    return res.status(200).json(medications);
  } catch (error) {
    return next(error);
  }
};

const getMedicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const medication = await client.medication.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    return res.status(200).json(medication);
  } catch (error) {
    return next(error);
  }
};

const createMedication = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      name, dosage, frequency, startDate, childId, ...rest
    } = req.body;

    if (!name || !dosage || !frequency || !startDate || !childId) {
      return res.status(400).json({ error: 'name, dosage, frequency, startDate and childId are required' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    const medicationData = normalizeMedicationData({
      name,
      dosage,
      frequency,
      startDate,
      childId,
      ...rest,
    });

    const medication = await client.medication.create({
      data: medicationData,
    });

    return res.status(201).json(medication);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'startDate and endDate must be valid dates' });
    }

    return next(error);
  }
};

const updateMedication = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingMedication = await client.medication.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingMedication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const data = normalizeMedicationData({ ...req.body });

    const medication = await client.medication.update({
      where: { id },
      data,
    });

    return res.status(200).json(medication);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Medication not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'startDate and endDate must be valid dates' });
    }

    return next(error);
  }
};

const deleteMedication = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingMedication = await client.medication.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingMedication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await client.medication.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Medication not found' });
    }

    return next(error);
  }
};

export {
  fetchMedicationsForFamily,
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
};
