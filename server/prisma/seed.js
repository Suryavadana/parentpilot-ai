import 'dotenv/config';
import bcrypt from 'bcrypt';
import { getPrismaClient } from '../lib/prisma.js';

const SALT_ROUNDS = 10;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const daysFromNow = (offset) => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const seedChildHealthRecords = async (prisma, family, config) => {
  const child = await prisma.child.upsert({
    where: { id: config.childId },
    update: {},
    create: {
      id: config.childId,
      fullName: config.fullName,
      dateOfBirth: config.dateOfBirth,
      familyId: family.id,
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { id: config.doctor.id },
    update: {
      name: config.doctor.name,
      specialty: config.doctor.specialty,
      phone: config.doctor.phone,
      email: config.doctor.email,
      address: config.doctor.address,
    },
    create: {
      ...config.doctor,
      childId: child.id,
      familyId: family.id,
    },
  });

  await Promise.all(config.medications.map((item) => prisma.medication.upsert({
    where: { id: item.id },
    update: {
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate,
      notes: item.notes,
    },
    create: { ...item, childId: child.id },
  })));

  await Promise.all(config.appointments.map((item) => prisma.appointment.upsert({
    where: { id: item.id },
    update: {
      reason: item.reason,
      scheduledAt: item.scheduledAt,
      status: item.status,
      notes: item.notes,
      doctorId: doctor.id,
    },
    create: { ...item, childId: child.id, doctorId: doctor.id },
  })));

  await Promise.all(config.vaccinations.map((item) => prisma.vaccination.upsert({
    where: { id: item.id },
    update: {
      vaccineName: item.vaccineName,
      doseNumber: item.doseNumber,
      dateAdministered: item.dateAdministered,
      nextDueDate: item.nextDueDate,
      administeredBy: item.administeredBy,
      notes: item.notes,
    },
    create: { ...item, childId: child.id },
  })));

  await Promise.all(config.growthRecords.map((item) => prisma.growthRecord.upsert({
    where: { id: item.id },
    update: {
      date: item.date,
      heightCm: item.heightCm,
      weightKg: item.weightKg,
      notes: item.notes,
    },
    create: { ...item, childId: child.id },
  })));

  await Promise.all(config.feedback.map((item) => prisma.feedback.upsert({
    where: { id: item.id },
    update: {
      source: item.source,
      category: item.category,
      content: item.content,
      date: item.date,
    },
    create: { ...item, childId: child.id },
  })));

  return {
    child,
    doctor,
    counts: {
      medications: config.medications.length,
      appointments: config.appointments.length,
      vaccinations: config.vaccinations.length,
      growthRecords: config.growthRecords.length,
      feedback: config.feedback.length,
    },
  };
};

const main = async () => {
  const prisma = getPrismaClient();

  const family = await prisma.family.upsert({
    where: { id: 'seed-family' },
    update: {},
    create: {
      id: 'seed-family',
      name: 'Test Family',
    },
  });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      email: TEST_EMAIL,
      passwordHash,
      fullName: 'Test Owner',
      role: 'owner',
      familyId: family.id,
    },
  });

  const child = await prisma.child.upsert({
    where: { id: 'seed-child' },
    update: {},
    create: {
      id: 'seed-child',
      fullName: 'Test Child',
      dateOfBirth: new Date('2018-01-01'),
      familyId: family.id,
    },
  });

  const homeworkItems = [
    {
      id: 'seed-homework-overdue',
      title: 'Math worksheet',
      subject: 'Math',
      dueDate: daysFromNow(-5),
      status: 'not_started',
    },
    {
      id: 'seed-homework-due-soon',
      title: 'Reading log',
      subject: 'English',
      dueDate: daysFromNow(2),
      status: 'in_progress',
    },
    {
      id: 'seed-homework-upcoming',
      title: 'Science project',
      subject: 'Science',
      dueDate: daysFromNow(10),
      status: 'not_started',
    },
    {
      id: 'seed-homework-done',
      title: 'Spelling test prep',
      subject: 'English',
      dueDate: daysFromNow(-3),
      status: 'done',
    },
  ];

  await Promise.all(homeworkItems.map((item) => prisma.homework.upsert({
    where: { id: item.id },
    update: {
      title: item.title,
      subject: item.subject,
      dueDate: item.dueDate,
      status: item.status,
    },
    create: {
      ...item,
      childId: child.id,
    },
  })));

  const feeItems = [
    {
      id: 'seed-fee-overdue',
      description: 'Field trip fee',
      amount: 25.0,
      dueDate: daysFromNow(-7),
      status: 'unpaid',
    },
    {
      id: 'seed-fee-due-soon',
      description: 'Lunch account top-up',
      amount: 40.0,
      dueDate: daysFromNow(2),
      status: 'unpaid',
    },
    {
      id: 'seed-fee-upcoming',
      description: 'Yearbook fee',
      amount: 35.0,
      dueDate: daysFromNow(14),
      status: 'unpaid',
    },
    {
      id: 'seed-fee-paid',
      description: 'Art supplies fee',
      amount: 15.0,
      dueDate: daysFromNow(-10),
      status: 'paid',
    },
  ];

  await Promise.all(feeItems.map((item) => prisma.fee.upsert({
    where: { id: item.id },
    update: {
      description: item.description,
      amount: item.amount,
      dueDate: item.dueDate,
      status: item.status,
    },
    create: {
      ...item,
      childId: child.id,
    },
  })));

  const announcementEvents = [
    {
      id: 'seed-event-announcement-1',
      title: 'Picture day next Friday',
      startDate: daysFromNow(4),
    },
    {
      id: 'seed-event-announcement-2',
      title: 'Parent-teacher conference sign-up open',
      startDate: daysFromNow(6),
    },
    {
      id: 'seed-event-announcement-3',
      title: 'School closed for holiday',
      startDate: daysFromNow(12),
    },
  ];

  await Promise.all(announcementEvents.map((item) => prisma.event.upsert({
    where: { id: item.id },
    update: {
      title: item.title,
      startDate: item.startDate,
    },
    create: {
      id: item.id,
      title: item.title,
      category: 'announcement',
      startDate: item.startDate,
      familyId: family.id,
    },
  })));

  const activityEvents = [
    {
      id: 'seed-event-activity-1',
      title: 'Soccer practice',
      startDate: daysFromNow(1),
    },
    {
      id: 'seed-event-activity-2',
      title: 'Piano lesson',
      startDate: daysFromNow(3),
    },
    {
      id: 'seed-event-activity-3',
      title: 'Art club',
      startDate: daysFromNow(5),
    },
  ];

  await Promise.all(activityEvents.map((item) => prisma.event.upsert({
    where: { id: item.id },
    update: {
      title: item.title,
      startDate: item.startDate,
    },
    create: {
      id: item.id,
      title: item.title,
      category: 'activity',
      startDate: item.startDate,
      childId: child.id,
      familyId: family.id,
    },
  })));

  const dailyScheduleItems = [
    {
      id: 'seed-schedule-mon-math', dayOfWeek: 1, startTime: '09:00', endTime: '09:45', subject: 'Math',
    },
    {
      id: 'seed-schedule-mon-english', dayOfWeek: 1, startTime: '10:00', endTime: '10:45', subject: 'English',
    },
    {
      id: 'seed-schedule-wed-science', dayOfWeek: 3, startTime: '09:00', endTime: '09:45', subject: 'Science',
    },
    {
      id: 'seed-schedule-wed-art', dayOfWeek: 3, startTime: '11:00', endTime: '11:45', subject: 'Art',
    },
    {
      id: 'seed-schedule-fri-pe', dayOfWeek: 5, startTime: '13:00', endTime: '13:45', subject: 'Physical Education',
    },
  ];

  await Promise.all(dailyScheduleItems.map((item) => prisma.dailySchedule.upsert({
    where: { id: item.id },
    update: {
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      subject: item.subject,
    },
    create: {
      ...item,
      childId: child.id,
    },
  })));

  const familyWideDoctor = await prisma.doctor.upsert({
    where: { id: 'seed-doctor-family-wide' },
    update: {},
    create: {
      id: 'seed-doctor-family-wide',
      name: 'Dr. Raj Patel',
      specialty: 'General Physician',
      phone: '555-0199',
      email: 'dr.patel@example.com',
      address: '456 Health Blvd',
      childId: null,
      familyId: family.id,
    },
  });

  const child2Result = await seedChildHealthRecords(prisma, family, {
    childId: 'seed-child-2',
    fullName: 'Test Child 2',
    dateOfBirth: new Date('2015-06-15'),
    doctor: {
      id: 'seed-doctor-child2',
      name: 'Dr. Emily Chen',
      specialty: 'Pediatrician',
      phone: '555-0182',
      email: 'dr.chen@example.com',
      address: '123 Clinic Way',
    },
    medications: [
      {
        id: 'seed-medication-child2-1',
        name: 'Amoxicillin',
        dosage: '250mg',
        frequency: 'Twice daily',
        startDate: daysFromNow(-10),
        endDate: daysFromNow(4),
        notes: 'For ear infection',
      },
      {
        id: 'seed-medication-child2-2',
        name: 'Vitamin D',
        dosage: '400 IU',
        frequency: 'Once daily',
        startDate: daysFromNow(-30),
        endDate: null,
        notes: 'Daily supplement',
      },
    ],
    appointments: [
      {
        id: 'seed-appointment-child2-1',
        reason: 'Annual checkup',
        scheduledAt: daysFromNow(5),
        status: 'upcoming',
        notes: 'Bring vaccination record',
      },
      {
        id: 'seed-appointment-child2-2',
        reason: 'Ear infection follow-up',
        scheduledAt: daysFromNow(-14),
        status: 'completed',
        notes: 'Infection cleared, no further action needed',
      },
    ],
    vaccinations: [
      {
        id: 'seed-vaccination-child2-1',
        vaccineName: 'Influenza',
        doseNumber: 1,
        dateAdministered: daysFromNow(-30),
        nextDueDate: daysFromNow(180),
        administeredBy: 'Dr. Emily Chen',
        notes: 'Seasonal flu shot',
      },
      {
        id: 'seed-vaccination-child2-2',
        vaccineName: 'MMR',
        doseNumber: 2,
        dateAdministered: daysFromNow(-365),
        nextDueDate: null,
        administeredBy: 'Dr. Emily Chen',
        notes: 'Final dose in series',
      },
    ],
    growthRecords: [
      {
        id: 'seed-growth-record-child2-1',
        date: daysFromNow(-60),
        heightCm: 110.5,
        weightKg: 19.2,
        notes: 'Routine checkup measurement',
      },
      {
        id: 'seed-growth-record-child2-2',
        date: daysFromNow(-5),
        heightCm: 111.2,
        weightKg: 19.8,
        notes: 'Growth spurt noticed',
      },
    ],
    feedback: [
      {
        id: 'seed-feedback-child2-1',
        source: 'Teacher - Ms. Rodriguez',
        category: 'academic',
        content: 'Test Child 2 has shown great improvement in reading comprehension this month.',
        date: daysFromNow(-3),
      },
      {
        id: 'seed-feedback-child2-2',
        source: 'School Nurse',
        category: 'health',
        content: 'Recommended an eye exam due to squinting at the board during class.',
        date: daysFromNow(-10),
      },
    ],
  });

  const child3Result = await seedChildHealthRecords(prisma, family, {
    childId: 'seed-child-3',
    fullName: 'Test Child 3',
    dateOfBirth: new Date('2012-09-20'),
    doctor: {
      id: 'seed-doctor-child3',
      name: 'Dr. Marcus Lee',
      specialty: 'Dentist',
      phone: '555-0173',
      email: 'dr.lee@example.com',
      address: '789 Smile St',
    },
    medications: [
      {
        id: 'seed-medication-child3-1',
        name: 'Albuterol Inhaler',
        dosage: '90mcg',
        frequency: 'As needed for asthma',
        startDate: daysFromNow(-180),
        endDate: null,
        notes: 'Keep at school and at home',
      },
      {
        id: 'seed-medication-child3-2',
        name: 'Cetirizine',
        dosage: '10mg',
        frequency: 'Once daily during allergy season',
        startDate: daysFromNow(-20),
        endDate: daysFromNow(10),
        notes: 'For seasonal allergies',
      },
    ],
    appointments: [
      {
        id: 'seed-appointment-child3-1',
        reason: 'Dental cleaning',
        scheduledAt: daysFromNow(1),
        status: 'upcoming',
        notes: 'Routine six-month cleaning',
      },
      {
        id: 'seed-appointment-child3-2',
        reason: 'Asthma check-in',
        scheduledAt: daysFromNow(-45),
        status: 'completed',
        notes: 'Breathing well, no changes to inhaler needed',
      },
    ],
    vaccinations: [
      {
        id: 'seed-vaccination-child3-1',
        vaccineName: 'Tdap',
        doseNumber: 1,
        dateAdministered: daysFromNow(-400),
        nextDueDate: daysFromNow(3200),
        administeredBy: 'Dr. Marcus Lee',
        notes: 'Booster before starting middle school',
      },
      {
        id: 'seed-vaccination-child3-2',
        vaccineName: 'COVID-19',
        doseNumber: 2,
        dateAdministered: daysFromNow(-90),
        nextDueDate: daysFromNow(90),
        administeredBy: 'Dr. Marcus Lee',
        notes: null,
      },
    ],
    growthRecords: [
      {
        id: 'seed-growth-record-child3-1',
        date: daysFromNow(-90),
        heightCm: 145.0,
        weightKg: 38.5,
        notes: 'Annual physical measurement',
      },
      {
        id: 'seed-growth-record-child3-2',
        date: daysFromNow(-10),
        heightCm: 146.2,
        weightKg: 39.4,
        notes: null,
      },
    ],
    feedback: [
      {
        id: 'seed-feedback-child3-1',
        source: 'Coach - Mr. Diaz',
        category: 'behavioral',
        content: 'Demonstrates excellent teamwork and sportsmanship during practice.',
        date: daysFromNow(-7),
      },
      {
        id: 'seed-feedback-child3-2',
        source: 'School Counselor',
        category: 'general',
        content: 'Settling in well after the recent move to a new class.',
        date: daysFromNow(-15),
      },
    ],
  });

  console.log('Seeded:', {
    family: family.name,
    user: user.email,
    child: child.fullName,
    homework: homeworkItems.length,
    fees: feeItems.length,
    announcementEvents: announcementEvents.length,
    activityEvents: activityEvents.length,
    dailySchedule: dailyScheduleItems.length,
    familyWideDoctor: familyWideDoctor.name,
    child2: child2Result.child.fullName,
    child2Doctor: child2Result.doctor.name,
    child2Counts: child2Result.counts,
    child3: child3Result.child.fullName,
    child3Doctor: child3Result.doctor.name,
    child3Counts: child3Result.counts,
  });
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
