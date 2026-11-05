import { Router, Request, Response } from 'express';
import { evaluateAndSendReminder, evaluateEventReminders, evaluateTrashReminders } from '../scheduler/reminderScheduler.js';

export const cronRouter = Router();

// GET or POST /api/cron/trigger
// Can be pinged by GitHub Actions, cron-job.org, UptimeRobot, or internal keep-alive
cronRouter.all('/trigger', async (req: Request, res: Response) => {
  const start = Date.now();
  console.log(`[Cron Trigger] Ping received at ${new Date().toISOString()} from ${req.ip}`);

  const results: Record<string, any> = {};

  try {
    results.water = await evaluateAndSendReminder();
  } catch (err) {
    results.water_error = (err as Error)?.message;
  }

  try {
    await evaluateEventReminders();
    results.events = 'evaluated';
  } catch (err) {
    results.events_error = (err as Error)?.message;
  }

  try {
    await evaluateTrashReminders();
    results.trash = 'evaluated';
  } catch (err) {
    results.trash_error = (err as Error)?.message;
  }

  const durationMs = Date.now() - start;

  res.json({
    success: true,
    service: 'WaterMate Cron Evaluator',
    duration_ms: durationMs,
    time: new Date().toISOString(),
    results,
  });
});
