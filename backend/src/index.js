import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './services/auth/routes.js';
import foodRoutes from './services/food/routes.js';
import workoutRoutes from './services/workout/routes.js';
import aiRoutes from './services/ai/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
