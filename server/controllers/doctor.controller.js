import { getPrismaClient } from '../lib/prisma.js';

const getDoctors = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const doctors = await client.doctor.findMany({
      where: {
        familyId: req.familyId,
        // With a specific child selected, show that child's doctors plus
        // family-wide doctors (childId === null) who can serve any child.
        ...(childId ? { OR: [{ childId }, { childId: null }] } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(doctors);
  } catch (error) {
    return next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const doctor = await client.doctor.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.status(200).json(doctor);
  } catch (error) {
    return next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { name, childId, ...rest } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (childId) {
      const child = await client.child.findFirst({
        where: { id: childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const doctor = await client.doctor.create({
      data: {
        name,
        childId: childId || null,
        ...rest,
        familyId: req.familyId,
      },
    });

    return res.status(201).json(doctor);
  } catch (error) {
    return next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingDoctor = await client.doctor.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const { familyId, ...updateBody } = req.body;

    const doctor = await client.doctor.update({
      where: { id },
      data: updateBody,
    });

    return res.status(200).json(doctor);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingDoctor = await client.doctor.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    await client.doctor.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return next(error);
  }
};

export {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
