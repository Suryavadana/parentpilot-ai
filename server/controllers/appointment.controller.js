import { getPrismaClient } from '../lib/prisma.js';
import { calculateUrgency } from '../lib/urgency.js';

const APPOINTMENT_STATUSES = ['upcoming', 'completed', 'cancelled'];

const normalizeAppointmentData = (data) => {
  const appointmentData = { ...data };

  if (appointmentData.scheduledAt) {
    const parsedScheduledAt = new Date(appointmentData.scheduledAt);

    if (Number.isNaN(parsedScheduledAt.getTime())) {
      throw new Error('INVALID_DATE');
    }

    appointmentData.scheduledAt = parsedScheduledAt;
  }

  return appointmentData;
};

const validateDoctorId = async (client, doctorId, familyId) => {
  if (!doctorId) {
    return true;
  }

  const doctor = await client.doctor.findFirst({
    where: { id: doctorId, familyId },
  });

  return Boolean(doctor);
};

const fetchAppointmentsForFamily = async ({ familyId, childId }) => {
  const client = getPrismaClient();

  const appointments = await client.appointment.findMany({
    where: {
      child: { familyId },
      ...(childId ? { childId } : {}),
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      child: {
        select: { fullName: true },
      },
      doctor: {
        select: { name: true },
      },
    },
  });

  return appointments.map((item) => ({
    ...item,
    urgency: calculateUrgency(item.scheduledAt, item.status, 'completed'),
  }));
};

const getAppointments = async (req, res, next) => {
  try {
    const { childId } = req.query;
    const appointmentsWithUrgency = await fetchAppointmentsForFamily({ familyId: req.familyId, childId });

    return res.status(200).json(appointmentsWithUrgency);
  } catch (error) {
    return next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const appointment = await client.appointment.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const {
      reason, scheduledAt, childId, status, doctorId, ...rest
    } = req.body;

    if (!reason || !scheduledAt || !childId) {
      return res.status(400).json({ error: 'reason, scheduledAt and childId are required' });
    }

    if (status && !APPOINTMENT_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be "upcoming", "completed" or "cancelled"' });
    }

    const child = await client.child.findFirst({
      where: { id: childId, familyId: req.familyId },
    });

    if (!child) {
      return res.status(400).json({ error: 'Invalid childId' });
    }

    if (doctorId && !(await validateDoctorId(client, doctorId, req.familyId))) {
      return res.status(400).json({ error: 'Invalid doctorId' });
    }

    const appointmentData = normalizeAppointmentData({
      reason,
      scheduledAt,
      childId,
      ...(status ? { status } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...rest,
    });

    const appointment = await client.appointment.create({
      data: appointmentData,
    });

    return res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'scheduledAt must be a valid date' });
    }

    return next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingAppointment = await client.appointment.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.body.status && !APPOINTMENT_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'status must be "upcoming", "completed" or "cancelled"' });
    }

    if (req.body.childId) {
      const child = await client.child.findFirst({
        where: { id: req.body.childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    if (req.body.doctorId && !(await validateDoctorId(client, req.body.doctorId, req.familyId))) {
      return res.status(400).json({ error: 'Invalid doctorId' });
    }

    const data = normalizeAppointmentData({ ...req.body });

    const appointment = await client.appointment.update({
      where: { id },
      data,
    });

    return res.status(200).json(appointment);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: 'scheduledAt must be a valid date' });
    }

    return next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { id } = req.params;

    const existingAppointment = await client.appointment.findFirst({
      where: { id, child: { familyId: req.familyId } },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await client.appointment.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return next(error);
  }
};

export {
  fetchAppointmentsForFamily,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
