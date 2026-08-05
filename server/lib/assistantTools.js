import { fetchHomeworkForFamily } from '../controllers/homework.controller.js';
import { fetchFeesForFamily } from '../controllers/fees.controller.js';
import { fetchEventsForFamily } from '../controllers/events.controller.js';
import { fetchAppointmentsForFamily } from '../controllers/appointment.controller.js';
import { fetchMedicationsForFamily } from '../controllers/medication.controller.js';

const CHILD_ID_PROPERTY = {
  type: 'string',
  description: 'Optional child id to filter results to a single child. Omit to include every child in the family.',
};

const TOOL_DECLARATIONS = [
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
];

// Tool functions are called with the model's args merged with a
// server-controlled familyId — the model never sees or sets familyId itself.
const TOOL_FUNCTIONS = {
  get_homework: ({ familyId, childId }) => fetchHomeworkForFamily({ familyId, childId }),
  get_fees: ({ familyId, childId }) => fetchFeesForFamily({ familyId, childId }),
  get_events: ({ familyId, childId, category }) => fetchEventsForFamily({ familyId, childId, category }),
  get_appointments: ({ familyId, childId }) => fetchAppointmentsForFamily({ familyId, childId }),
  get_medications: ({ familyId, childId }) => fetchMedicationsForFamily({ familyId, childId }),
};

export { TOOL_DECLARATIONS, TOOL_FUNCTIONS };
