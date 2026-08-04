import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import childrenRoutes from './routes/children.routes.js';
import eventsRoutes from './routes/events.routes.js';
import homeworkRoutes from './routes/homework.routes.js';
import feesRoutes from './routes/fees.routes.js';
import dailyScheduleRoutes from './routes/dailySchedule.routes.js';
import activityRoutes from './routes/activity.routes.js';
import authRoutes from './routes/auth.routes.js';
import requireAuth from './middleware/requireAuth.js';
import attachFamily from './middleware/attachFamily.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use('/api/children', requireAuth, attachFamily, childrenRoutes);
app.use('/api/events', requireAuth, attachFamily, eventsRoutes);
app.use('/api/homework', requireAuth, attachFamily, homeworkRoutes);
app.use('/api/fees', requireAuth, attachFamily, feesRoutes);
app.use('/api/daily-schedule', requireAuth, attachFamily, dailyScheduleRoutes);
app.use('/api/activities', requireAuth, attachFamily, activityRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
