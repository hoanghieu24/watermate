import { Router, Request, Response } from 'express';
import { dbGet, dbRun } from '../db/database.js';

export const reminderSettingsRouter = Router();

interface DbReminderSettings {
  id: number;
  enabled: number | boolean;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  timezone: string;
  notification_message: string;
  paused_until: string | null;
  quiet_hours_enabled: number | boolean;
  quiet_start_time: string;
  quiet_end_time: string;
}

// GET /api/reminder-settings
reminderSettingsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const row = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');
    if (!row) {
      return res.status(404).json({ error: 'Cài đặt chưa khởi tạo' });
    }

    res.json({
      ...row,
      enabled: Boolean(row.enabled),
      quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Lỗi tải cài đặt nhắc nhở' });
  }
});

// PUT /api/reminder-settings
reminderSettingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const {
      enabled,
      start_time,
      end_time,
      interval_minutes,
      timezone,
      notification_message,
      paused_until,
      quiet_hours_enabled,
      quiet_start_time,
      quiet_end_time,
    } = req.body;

    const current = (await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1')) || {
      id: 1,
      enabled: 1,
      start_time: '08:00',
      end_time: '22:00',
      interval_minutes: 60,
      timezone: 'Asia/Ho_Chi_Minh',
      notification_message: '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.',
      paused_until: null,
      quiet_hours_enabled: 0,
      quiet_start_time: '12:00',
      quiet_end_time: '13:30',
    };

    const newEnabled = enabled !== undefined ? (enabled ? 1 : 0) : (current.enabled ? 1 : 0);
    const newStartTime = String(start_time || current.start_time || '08:00');
    const newEndTime = String(end_time || current.end_time || '22:00');
    const newInterval = Number(interval_minutes) || current.interval_minutes || 60;
    const newTimezone = String(timezone || current.timezone || 'Asia/Ho_Chi_Minh');
    const newMsg = String(notification_message !== undefined ? notification_message : current.notification_message);
    const newPausedUntil = paused_until ? String(paused_until) : null;
    const newQuietEnabled = quiet_hours_enabled !== undefined ? (quiet_hours_enabled ? 1 : 0) : (current.quiet_hours_enabled ? 1 : 0);
    const newQuietStart = String(quiet_start_time || current.quiet_start_time || '12:00');
    const newQuietEnd = String(quiet_end_time || current.quiet_end_time || '13:30');

    await dbRun(`
      UPDATE reminder_settings
      SET enabled = ?, start_time = ?, end_time = ?, interval_minutes = ?, timezone = ?,
          notification_message = ?, paused_until = ?, quiet_hours_enabled = ?,
          quiet_start_time = ?, quiet_end_time = ?
      WHERE id = 1
    `, [
      newEnabled,
      newStartTime,
      newEndTime,
      newInterval,
      newTimezone,
      newMsg,
      newPausedUntil,
      newQuietEnabled,
      newQuietStart,
      newQuietEnd,
    ]);

    const saved = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');
    res.json({
      ...saved,
      enabled: Boolean(saved?.enabled),
      quiet_hours_enabled: Boolean(saved?.quiet_hours_enabled),
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Lỗi cập nhật cài đặt nhắc nhở' });
  }
});
