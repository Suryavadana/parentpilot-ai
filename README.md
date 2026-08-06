# ParentPilotAI

ParentPilotAI is a family organizer app for school, health, activities, and
AI-assisted planning. Parents (and the caregivers they invite) can track
homework, fees, calendar events, medical records, and documents for every
child in the family from one shared, role-aware dashboard — with an AI
assistant that can answer questions and draft new entries on request.

## Features

Grouped by what's actually implemented in the app, not aspirational scope.

### Children & Family Sharing
- Add and manage multiple children per family, each with their own profile
  (school, grade, allergies, medical conditions, blood group, etc.)
- Invite other users into your family as a **parent** or **caregiver**, with
  role-based access control (caregivers can't see fees or documents)
- A per-child profile page, plus a cross-child **Family Overview** dashboard
  and a "Today" reminders dashboard combining everything that's due or
  overdue across homework, fees, and appointments
- Printable **Briefing Sheet** and **Vaccination Record** pages (e.g. to hand
  to a babysitter or school)

### School Management
- Homework tracking with due dates and status
- School fees tracking with due dates and paid/unpaid status
- A monthly calendar of events (school, activity, medical, family,
  announcement categories)
- Per-child and family-wide announcements
- Daily schedule and extracurricular activities

### Health Records
- Medications, with dosage, frequency, and active date ranges
- Doctors and medical appointments
- Vaccination records
- Growth records (height/weight over time)
- Feedback/notes log (e.g. from teachers or doctors)

### Document Vault
- Upload family documents (e.g. report cards, medical records), encrypted at
  rest with AES-256-GCM before being stored
- Download and delete previously uploaded documents

### AI-Powered Tools
- **AI Calendar Import**: upload a photo (e.g. a school newsletter) and have
  Gemini extract calendar events from it for review before saving
- **AI Assistant**: a chat assistant that can answer questions about a
  family's homework, fees, events, appointments, and medications, and can
  propose new homework, events, or appointments — using a propose-then-confirm
  pattern where the assistant never writes to the database directly; the user
  always reviews and confirms before anything is saved

### Account & Access Control
- Email/password authentication with JWT sessions
- Family invites via a signed, expiring invite token
- Account deletion from Settings, including family-teardown handling when
  the last member of a family deletes their account
- Owners can view and remove other family members

## Tech Stack

**Frontend**: React 19, Vite, React Router, Axios

**Backend**: Node.js (ESM), Express 5, Prisma ORM (`@prisma/client`,
`@prisma/adapter-pg`), PostgreSQL, JWT (`jsonwebtoken`), bcrypt, Multer

**AI**: Google Gemini (`@google/genai`) — used for AI calendar image
extraction and the AI Assistant's chat/tool-calling

## Project Structure

```
parentpilot-ai/
├── client/                 React + Vite frontend
│   └── src/
│       ├── components/     Pages and UI panels (one per feature area)
│       ├── context/        AuthContext, ChildContext (React context providers)
│       └── App.jsx         Route definitions
└── server/                 Express + Prisma backend
    ├── controllers/        Route handlers (one per resource)
    ├── routes/             Express routers, mounted in index.js
    ├── middleware/         requireAuth, attachFamily, requireRole
    ├── lib/                Prisma client, Gemini client, encryption helpers
    ├── prisma/             schema.prisma and the seed script
    ├── scripts/            One-off setup/utility scripts
    └── index.js            App entry point and route mounting
```

## Getting Started

### Prerequisites
- Node.js
- A Google Gemini API key (for the AI Assistant and AI calendar import)

### 1. Clone the repo
```bash
git clone <repo-url>
cd parentpilot-ai
```

### 2. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 3. Set up a local Postgres database

From `server/`, Prisma can spin up a local Postgres instance for you:
```bash
npx prisma dev
```

### 4. Configure environment variables

Create a `.env` file in `server/` with the following variables (see
`server/scripts/generate-encryption-key.js` to generate a value for
`DOCUMENT_ENCRYPTION_KEY`):

- `DATABASE_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `DOCUMENT_ENCRYPTION_KEY`

### 5. Set up and seed the database
```bash
cd server
npm run db:reset
```

### 6. Start the dev servers

In separate terminals:
```bash
cd server && npm run dev
cd client && npm run dev
```

The client dev server proxies `/api` requests to the server (default
`http://localhost:3000`), so both need to be running.

## Status

This is a personal/learning project, currently in local development, with
deployment in progress.

The privacy policy at `/privacy` is currently a placeholder pending legal
review — it has not been reviewed by a lawyer and should not be relied upon
for an app store submission or public launch.
