import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { initDatabase } from './db/database.js';
import { waterLogsRouter } from './routes/waterLogs.js';
import { reminderSettingsRouter } from './routes/reminderSettings.js';
import { pushRouter } from './routes/push.js';
import { startReminderScheduler } from './scheduler/reminderScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'WaterMate Backend',
    database: process.env.DATABASE_URL ? 'PostgreSQL (Aiven)' : 'SQLite',
    time: new Date().toISOString(),
  });
});

app.use('/api/water-logs', waterLogsRouter);
app.use('/api/reminder-settings', reminderSettingsRouter);
app.use('/api/push', pushRouter);

// Disable caching for HTML and Service Worker so updates are immediate
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || req.path === '/sw.js' || req.path === '/registerSW.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve Frontend Static Files in Production or if dist exists
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log('Serving frontend build from:', frontendDistPath);
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

async function startServer() {
  await initDatabase();
  startReminderScheduler();

  app.listen(PORT, () => {
    console.log(`💧 WaterMate Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Aiven)' : 'SQLite'}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
