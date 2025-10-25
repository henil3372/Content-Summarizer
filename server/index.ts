import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reelsRouter } from './routes/reels';
import { contentRouter } from './routes/content';
import { setupDirectories } from './utils/filesystem';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { initializeWorker } from './queue/worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(rateLimitMiddleware);

app.use('/api/reels', reelsRouter);
app.use('/api/content', contentRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  try {
    await setupDirectories();
    initializeWorker();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
