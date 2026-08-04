const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const calculateUrgency = (dueDate, status, completedStatus = 'done') => {
  if (status === completedStatus) {
    return completedStatus;
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysUntilDue < 0) {
    return 'overdue';
  }

  if (daysUntilDue <= 3) {
    return 'due_soon';
  }

  return 'upcoming';
};

export { calculateUrgency };
