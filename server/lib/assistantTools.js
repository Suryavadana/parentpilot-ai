import { getPrismaClient } from './prisma.js';
import { fetchChildrenForFamily } from '../controllers/children.controller.js';
import { fetchHomeworkForFamily } from '../controllers/homework.controller.js';
import { fetchFeesForFamily } from '../controllers/fees.controller.js';
import { fetchEventsForFamily } from '../controllers/events.controller.js';
import { fetchAppointmentsForFamily } from '../controllers/appointment.controller.js';
import { fetchMedicationsForFamily } from '../controllers/medication.controller.js';

const CHILD_ID_PROPERTY = {
  type: 'string',
  description: 'Optional child id to filter results to a single child. Omit to include every child in the family.',
};

const CHILD_NAME_PROPOSAL_PROPERTY = {
  type: 'string',
  description: "The child's name exactly as mentioned by the user.",
};

const TOOL_DECLARATIONS = [
  {
    name: 'get_children',
    description: "Get the family's children, each with their id and fullName. Useful context before proposing something, but not required — propose_create_* tools resolve childName to the correct child deterministically on their own.",
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_homework',
    description: "Get the family's homework assignments, optionally filtered to a single child. Each item includes title, subject, dueDate, status (not_started/in_progress/done), and a computed urgency (overdue/due_soon/upcoming/done).",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        childId: CHILD_ID_PROPERTY,
      },
    },
  },
  {
    name: 'get_fees',
    description: "Get the family's school fees, optionally filtered to a single child. Each item includes description, amount, dueDate, status (unpaid/paid), and a computed urgency (overdue/due_soon/upcoming/done).",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        childId: CHILD_ID_PROPERTY,
      },
    },
  },
  {
    name: 'get_events',
    description: "Get the family's calendar events, optionally filtered by child and/or category. Each item includes title, category, startDate, endDate, location, and allDay.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        childId: CHILD_ID_PROPERTY,
        category: {
          type: 'string',
          enum: ['school', 'activity', 'medical', 'family', 'announcement'],
          description: 'Optional category to filter events by.',
        },
      },
    },
  },
  {
    name: 'get_appointments',
    description: "Get the family's doctor/medical appointments, optionally filtered to a single child. Each item includes reason, scheduledAt, status (upcoming/completed/cancelled), the linked doctor's name if any, and a computed urgency.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        childId: CHILD_ID_PROPERTY,
      },
    },
  },
  {
    name: 'get_medications',
    description: "Get the family's medications, optionally filtered to a single child. Each item includes name, dosage, frequency, startDate, and endDate (absent or null means the medication is ongoing).",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        childId: CHILD_ID_PROPERTY,
      },
    },
  },
  {
    name: 'propose_create_homework',
    description: 'Propose creating a new homework assignment. This does NOT save anything to the database — it only prepares a proposal that the user must review and explicitly confirm themselves before it is actually created.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The homework title.' },
        subject: { type: 'string', description: 'The school subject, e.g. "Math".' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format.' },
        childName: CHILD_NAME_PROPOSAL_PROPERTY,
      },
      required: ['title', 'subject', 'dueDate', 'childName'],
    },
  },
  {
    name: 'propose_create_event',
    description: 'Propose creating a new calendar event. This does NOT save anything to the database — it only prepares a proposal that the user must review and explicitly confirm themselves before it is actually created.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The event title.' },
        category: {
          type: 'string',
          enum: ['school', 'activity', 'medical', 'family', 'announcement'],
          description: 'The event category.',
        },
        startDate: {
          type: 'string',
          description: 'Start date (and time, if known) in ISO 8601 format, e.g. "2026-08-15" or "2026-08-15T09:00:00".',
        },
        childName: CHILD_NAME_PROPOSAL_PROPERTY,
        description: { type: 'string', description: 'Optional additional details about the event.' },
      },
      required: ['title', 'category', 'startDate', 'childName'],
    },
  },
  {
    name: 'propose_create_appointment',
    description: 'Propose creating a new doctor/medical appointment. This does NOT save anything to the database — it only prepares a proposal that the user must review and explicitly confirm themselves before it is actually created.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for the appointment, e.g. "Annual checkup".' },
        scheduledAt: { type: 'string', description: 'Date and time of the appointment in ISO 8601 format.' },
        childName: CHILD_NAME_PROPOSAL_PROPERTY,
        doctorId: { type: 'string', description: 'Optional id of the doctor for this appointment, if known.' },
      },
      required: ['reason', 'scheduledAt', 'childName'],
    },
  },
];

const assertDoctorBelongsToFamily = async (familyId, doctorId) => {
  const client = getPrismaClient();
  const doctor = await client.doctor.findFirst({
    where: { id: doctorId, familyId },
    select: { id: true },
  });

  if (!doctor) {
    throw new Error(`doctorId "${doctorId}" does not exist in this family. Look up the correct id first (e.g. via get_appointments) rather than guessing.`);
  }
};

// Case-insensitive exact match first, then case-insensitive "contains" match
// (so "child 3" still finds "Test Child 3"). Returns the single match, or
// flags ambiguity when more than one child matches — silently picking the
// first of several matches is exactly the kind of wrong-child mistake this
// resolver exists to prevent.
const findChildByName = (children, childName) => {
  const normalized = childName.trim().toLowerCase();

  const exactMatches = children.filter((child) => child.fullName.trim().toLowerCase() === normalized);
  if (exactMatches.length === 1) return { match: exactMatches[0], ambiguous: null };
  if (exactMatches.length > 1) return { match: null, ambiguous: exactMatches };

  const partialMatches = children.filter((child) => child.fullName.toLowerCase().includes(normalized));
  if (partialMatches.length === 1) return { match: partialMatches[0], ambiguous: null };
  if (partialMatches.length > 1) return { match: null, ambiguous: partialMatches };

  return { match: null, ambiguous: null };
};

// The single source of truth for turning a childName into a real childId.
// Resolution happens here, in code, against the family's actual children —
// never by trusting an id the model produced. childName is the only input;
// there is no childId parameter to fall back on.
const resolveChildByName = async (familyId, childName) => {
  if (!childName) {
    throw new Error('childName is required to identify which child this is for.');
  }

  const children = await fetchChildrenForFamily({ familyId });
  const { match, ambiguous } = findChildByName(children, childName);

  if (match) {
    return match.id;
  }

  if (ambiguous) {
    const candidateNames = ambiguous.map((child) => child.fullName).join(', ');
    throw new Error(`childName "${childName}" matches multiple children: ${candidateNames}. Ask the user which one they mean, then retry with the exact name.`);
  }

  const availableNames = children.length > 0
    ? children.map((child) => child.fullName).join(', ')
    : '(no children on file for this family)';

  throw new Error(
    `childName "${childName}" does not match any child in this family. `
    + `Available children: ${availableNames}. Ask the user to clarify which child they mean.`,
  );
};

const proposeCreateHomework = async ({
  familyId, childName, title, subject, dueDate,
}) => {
  if (!title || !subject || !dueDate) {
    throw new Error('title, subject, and dueDate are required');
  }

  const resolvedChildId = await resolveChildByName(familyId, childName);

  return {
    type: 'homework', title, subject, dueDate, childId: resolvedChildId,
  };
};

const proposeCreateEvent = async ({
  familyId, childName, title, category, startDate, description,
}) => {
  if (!title || !category || !startDate) {
    throw new Error('title, category, and startDate are required');
  }

  const resolvedChildId = await resolveChildByName(familyId, childName);

  return {
    type: 'event', title, category, startDate, childId: resolvedChildId, description: description || null,
  };
};

const proposeCreateAppointment = async ({
  familyId, childName, reason, scheduledAt, doctorId,
}) => {
  if (!reason || !scheduledAt) {
    throw new Error('reason and scheduledAt are required');
  }

  const resolvedChildId = await resolveChildByName(familyId, childName);

  if (doctorId) {
    await assertDoctorBelongsToFamily(familyId, doctorId);
  }

  return {
    type: 'appointment', reason, scheduledAt, childId: resolvedChildId, doctorId: doctorId || null,
  };
};

// Tool functions are called with the model's args merged with a
// server-controlled familyId — the model never sees or sets familyId itself.
const TOOL_FUNCTIONS = {
  get_children: async ({ familyId }) => {
    const children = await fetchChildrenForFamily({ familyId });
    return children.map((child) => ({ id: child.id, fullName: child.fullName }));
  },
  get_homework: ({ familyId, childId }) => fetchHomeworkForFamily({ familyId, childId }),
  get_fees: ({ familyId, childId }) => fetchFeesForFamily({ familyId, childId }),
  get_events: ({ familyId, childId, category }) => fetchEventsForFamily({ familyId, childId, category }),
  get_appointments: ({ familyId, childId }) => fetchAppointmentsForFamily({ familyId, childId }),
  get_medications: ({ familyId, childId }) => fetchMedicationsForFamily({ familyId, childId }),
  propose_create_homework: ({
    familyId, childName, title, subject, dueDate,
  }) => proposeCreateHomework({
    familyId, childName, title, subject, dueDate,
  }),
  propose_create_event: ({
    familyId, childName, title, category, startDate, description,
  }) => proposeCreateEvent({
    familyId, childName, title, category, startDate, description,
  }),
  propose_create_appointment: ({
    familyId, childName, reason, scheduledAt, doctorId,
  }) => proposeCreateAppointment({
    familyId, childName, reason, scheduledAt, doctorId,
  }),
};

export { TOOL_DECLARATIONS, TOOL_FUNCTIONS };
