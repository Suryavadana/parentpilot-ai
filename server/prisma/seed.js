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

  console.log('Seeded:', {
    family: family.name,
    user: user.email,
    child: child.fullName,
    homework: homeworkItems.length,
    fees: feeItems.length,
    announcementEvents: announcementEvents.length,
    activityEvents: activityEvents.length,
    dailySchedule: dailyScheduleItems.length,
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
