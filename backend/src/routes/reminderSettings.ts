import { Router, Request, Response } from 'express';
import { dbGet, dbRun } from '../db/database.js';

export const reminderSettingsRouter = Router();

export interface DbReminderSettings {
  id: number;
  enabled: number | boolean;
  water_enabled?: number | boolean;
  event_enabled?: number | boolean;
  event_auto_delete?: number | boolean;
  trash_enabled?: number | boolean;
  trash_days?: string;
  trash_mode?: string;
  trash_interval_days?: number;
  trash_start_date?: string;
  trash_time?: string;
  trash_message?: string;
  last_trash_notified_date?: string | null;
  user_id?: string | null;
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
reminderSettingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    let row: DbReminderSettings | null = null;

    if (req.userId) {
      row = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE user_id = ?', [req.userId]);
      if (!row) {
        // Fallback to default template
        const fallback = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');
        if (fallback) {
          await dbRun(`
            INSERT INTO reminder_settings (
              enabled, water_enabled, event_enabled, event_auto_delete, trash_enabled,
              trash_days, trash_mode, trash_interval_days, trash_start_date, trash_time, trash_message, user_id, start_time, end_time,
              interval_minutes, timezone, notification_message, quiet_hours_enabled,
              quiet_start_time, quiet_end_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            fallback.enabled ? 1 : 0,
            fallback.water_enabled !== undefined ? (fallback.water_enabled ? 1 : 0) : 1,
            fallback.event_enabled !== undefined ? (fallback.event_enabled ? 1 : 0) : 1,
            fallback.event_auto_delete !== undefined ? (fallback.event_auto_delete ? 1 : 0) : 1,
            fallback.trash_enabled !== undefined ? (fallback.trash_enabled ? 1 : 0) : 0,
            fallback.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31',
            fallback.trash_mode || 'days_of_month',
            fallback.trash_interval_days || 1,
            fallback.trash_start_date || '2026-01-01',
            fallback.trash_time || '19:00',
            fallback.trash_message || '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
            req.userId,
            fallback.start_time || '08:00',
            fallback.end_time || '22:00',
            fallback.interval_minutes || 60,
            fallback.timezone || 'Asia/Ho_Chi_Minh',
            fallback.notification_message || '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.',
            fallback.quiet_hours_enabled ? 1 : 0,
            fallback.quiet_start_time || '12:00',
            fallback.quiet_end_time || '13:30',
          ]);
          row = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE user_id = ?', [req.userId]);
        }
      }
    }

    if (!row) {
      row = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');
    }

    if (!row) {
      return res.status(404).json({ error: 'Cài đặt chưa khởi tạo' });
    }

    res.json({
      ...row,
      enabled: Boolean(row.enabled),
      water_enabled: row.water_enabled !== undefined ? Boolean(row.water_enabled) : Boolean(row.enabled),
      event_enabled: row.event_enabled !== undefined ? Boolean(row.event_enabled) : true,
      event_auto_delete: row.event_auto_delete !== undefined ? Boolean(row.event_auto_delete) : true,
      trash_enabled: row.trash_enabled !== undefined ? Boolean(row.trash_enabled) : false,
      trash_days: row.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31',
      trash_mode: row.trash_mode || 'days_of_month',
      trash_interval_days: Number(row.trash_interval_days) || 1,
      trash_start_date: row.trash_start_date || '2026-01-01',
      trash_time: row.trash_time || '19:00',
      trash_message: row.trash_message || '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
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
      water_enabled,
      event_enabled,
      event_auto_delete,
      trash_enabled,
      trash_days,
      trash_mode,
      trash_interval_days,
      trash_start_date,
      trash_time,
      trash_message,
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

    const targetWhere = req.userId ? 'WHERE user_id = ?' : 'WHERE id = 1';
    const targetParams = req.userId ? [req.userId] : [];

    let current = await dbGet<DbReminderSettings>(`SELECT * FROM reminder_settings ${targetWhere}`, targetParams);
    if (!current) {
      current = await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');
    }

    const newEnabled = enabled !== undefined ? (enabled ? 1 : 0) : (current?.enabled ? 1 : 0);
    const newWaterEnabled = water_enabled !== undefined ? (water_enabled ? 1 : 0) : (current?.water_enabled !== undefined ? (current.water_enabled ? 1 : 0) : newEnabled);
    const newEventEnabled = event_enabled !== undefined ? (event_enabled ? 1 : 0) : (current?.event_enabled !== undefined ? (current.event_enabled ? 1 : 0) : 1);
    const newEventAutoDelete = event_auto_delete !== undefined ? (event_auto_delete ? 1 : 0) : (current?.event_auto_delete !== undefined ? (current.event_auto_delete ? 1 : 0) : 1);
    const newTrashEnabled = trash_enabled !== undefined ? (trash_enabled ? 1 : 0) : (current?.trash_enabled ? 1 : 0);
    const newTrashDays = String(trash_days || current?.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31');
    const newTrashMode = String(trash_mode || current?.trash_mode || 'days_of_month');
    const newTrashInterval = Number(trash_interval_days) || current?.trash_interval_days || 1;
    const newTrashStartDate = String(trash_start_date || current?.trash_start_date || '2026-01-01');
    const newTrashTime = String(trash_time || current?.trash_time || '19:00');
    const newTrashMessage = String(trash_message || current?.trash_message || '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.');

    const newStartTime = String(start_time || current?.start_time || '08:00');
    const newEndTime = String(end_time || current?.end_time || '22:00');
    const newInterval = Number(interval_minutes) || current?.interval_minutes || 60;
    const newTimezone = String(timezone || current?.timezone || 'Asia/Ho_Chi_Minh');
    const newMsg = String(notification_message !== undefined ? notification_message : (current?.notification_message || '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.'));
    const newPausedUntil = paused_until ? String(paused_until) : null;
    const newQuietEnabled = quiet_hours_enabled !== undefined ? (quiet_hours_enabled ? 1 : 0) : (current?.quiet_hours_enabled ? 1 : 0);
    const newQuietStart = String(quiet_start_time || current?.quiet_start_time || '12:00');
    const newQuietEnd = String(quiet_end_time || current?.quiet_end_time || '13:30');

    if (req.userId) {
      const exists = await dbGet('SELECT id FROM reminder_settings WHERE user_id = ?', [req.userId]);
      if (exists) {
        await dbRun(`
          UPDATE reminder_settings
          SET enabled = ?, water_enabled = ?, event_enabled = ?, event_auto_delete = ?,
              trash_enabled = ?, trash_days = ?, trash_mode = ?, trash_interval_days = ?, trash_start_date = ?, trash_time = ?, trash_message = ?,
              start_time = ?, end_time = ?, interval_minutes = ?, timezone = ?,
              notification_message = ?, paused_until = ?, quiet_hours_enabled = ?,
              quiet_start_time = ?, quiet_end_time = ?
          WHERE user_id = ?
        `, [
          newEnabled, newWaterEnabled, newEventEnabled, newEventAutoDelete,
          newTrashEnabled, newTrashDays, newTrashMode, newTrashInterval, newTrashStartDate, newTrashTime, newTrashMessage,
          newStartTime, newEndTime, newInterval, newTimezone,
          newMsg, newPausedUntil, newQuietEnabled,
          newQuietStart, newQuietEnd,
          req.userId
        ]);
      } else {
        await dbRun(`
          INSERT INTO reminder_settings (
            enabled, water_enabled, event_enabled, event_auto_delete,
            trash_enabled, trash_days, trash_mode, trash_interval_days, trash_start_date, trash_time, trash_message, user_id,
            start_time, end_time, interval_minutes, timezone,
            notification_message, paused_until, quiet_hours_enabled,
            quiet_start_time, quiet_end_time
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newEnabled, newWaterEnabled, newEventEnabled, newEventAutoDelete,
          newTrashEnabled, newTrashDays, newTrashMode, newTrashInterval, newTrashStartDate, newTrashTime, newTrashMessage, req.userId,
          newStartTime, newEndTime, newInterval, newTimezone,
          newMsg, newPausedUntil, newQuietEnabled,
          newQuietStart, newQuietEnd
        ]);
      }
    } else {
      await dbRun(`
        UPDATE reminder_settings
        SET enabled = ?, water_enabled = ?, event_enabled = ?, event_auto_delete = ?,
            trash_enabled = ?, trash_days = ?, trash_mode = ?, trash_interval_days = ?, trash_start_date = ?, trash_time = ?, trash_message = ?,
            start_time = ?, end_time = ?, interval_minutes = ?, timezone = ?,
            notification_message = ?, paused_until = ?, quiet_hours_enabled = ?,
            quiet_start_time = ?, quiet_end_time = ?
        WHERE id = 1
      `, [
        newEnabled, newWaterEnabled, newEventEnabled, newEventAutoDelete,
        newTrashEnabled, newTrashDays, newTrashMode, newTrashInterval, newTrashStartDate, newTrashTime, newTrashMessage,
        newStartTime, newEndTime, newInterval, newTimezone,
        newMsg, newPausedUntil, newQuietEnabled,
        newQuietStart, newQuietEnd,
      ]);
    }

    const saved = req.userId
      ? await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE user_id = ?', [req.userId])
      : await dbGet<DbReminderSettings>('SELECT * FROM reminder_settings WHERE id = 1');

    res.json({
      ...saved,
      enabled: Boolean(saved?.enabled),
      water_enabled: Boolean(saved?.water_enabled),
      event_enabled: Boolean(saved?.event_enabled),
      event_auto_delete: Boolean(saved?.event_auto_delete),
      trash_enabled: Boolean(saved?.trash_enabled),
      trash_days: saved?.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31',
      trash_mode: saved?.trash_mode || 'days_of_month',
      trash_interval_days: Number(saved?.trash_interval_days) || 1,
      trash_start_date: saved?.trash_start_date || '2026-01-01',
      trash_time: saved?.trash_time || '19:00',
      trash_message: saved?.trash_message || '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
      quiet_hours_enabled: Boolean(saved?.quiet_hours_enabled),
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Lỗi cập nhật cài đặt nhắc nhở' });
  }
});
