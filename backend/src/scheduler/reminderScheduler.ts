import cron from 'node-cron';
import { dbGet, dbRun, dbQuery } from '../db/database.js';
import { sendNotificationToAll } from '../services/pushService.js';

interface ReminderSettingsRow {
  id: number;
  enabled: number | boolean;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  timezone: string;
  notification_message: string;
  paused_until: string | null;
  quiet_hours_enabled?: number | boolean;
  quiet_start_time?: string;
  quiet_end_time?: string;
}

export function startReminderScheduler() {
  console.log('Starting WaterMate Reminder Scheduler (node-cron)...');

  // Run every minute: check if it's time to trigger water and event reminders
  cron.schedule('* * * * *', async () => {
    try {
      await evaluateAndSendReminder();
    } catch (err) {
      console.error('Error during water reminder evaluation:', err);
    }

    try {
      await evaluateEventReminders();
    } catch (err) {
      console.error('Error during event reminder evaluation:', err);
    }
  });
}

export function isTimeInQuietHours(currentTotalMinutes: number, quietStart: string, quietEnd: string): boolean {
  const [qStartH, qStartM] = quietStart.split(':').map(Number);
  const quietStartMinutes = qStartH * 60 + qStartM;

  const [qEndH, qEndM] = quietEnd.split(':').map(Number);
  const quietEndMinutes = qEndH * 60 + qEndM;

  // Case 1: Quiet range within same day (e.g., 12:00 to 13:30)
  if (quietStartMinutes < quietEndMinutes) {
    return currentTotalMinutes >= quietStartMinutes && currentTotalMinutes < quietEndMinutes;
  }

  // Case 2: Quiet range crossing midnight (e.g., 22:00 to 07:00)
  if (quietStartMinutes > quietEndMinutes) {
    return currentTotalMinutes >= quietStartMinutes || currentTotalMinutes < quietEndMinutes;
  }

  // Equal means 0 duration
  return false;
}

export async function evaluateAndSendReminder(): Promise<boolean> {
  const settings = await dbGet<ReminderSettingsRow>('SELECT * FROM reminder_settings WHERE id = 1');
  if (!settings || !settings.enabled) {
    return false;
  }

  const now = new Date();

  // Check if paused
  if (settings.paused_until) {
    const pausedUntil = new Date(settings.paused_until);
    if (now < pausedUntil) {
      return false;
    }
  }

  // Get current time in configured timezone (default Asia/Ho_Chi_Minh)
  const tz = settings.timezone || 'Asia/Ho_Chi_Minh';
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTimeStr = timeFormatter.format(now); // "HH:mm"
  const [currentH, currentM] = currentTimeStr.split(':').map(Number);
  const currentTotalMinutes = currentH * 60 + currentM;

  // Check Quiet Hours (Không làm phiền / không nhắc)
  if (settings.quiet_hours_enabled && settings.quiet_start_time && settings.quiet_end_time) {
    if (isTimeInQuietHours(currentTotalMinutes, settings.quiet_start_time, settings.quiet_end_time)) {
      console.log(`[Scheduler] Trong khung giờ yên tĩnh (${settings.quiet_start_time} - ${settings.quiet_end_time}), bỏ qua nhắc.`);
      return false;
    }
  }

  const [startH, startM] = settings.start_time.split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;

  const [endH, endM] = settings.end_time.split(':').map(Number);
  const endTotalMinutes = endH * 60 + endM;

  // Check if inside allowed daily time window
  if (currentTotalMinutes < startTotalMinutes || currentTotalMinutes > endTotalMinutes) {
    return false;
  }

  // Check interval alignment: (currentTotalMinutes - startTotalMinutes) % intervalMinutes === 0
  const intervalMinutes = Math.max(10, settings.interval_minutes || 60);
  const minutesSinceStart = currentTotalMinutes - startTotalMinutes;
  const isIntervalTick = minutesSinceStart >= 0 && (minutesSinceStart % intervalMinutes === 0);

  if (!isIntervalTick) {
    return false;
  }

  // Prevent duplicate reminders within the same minute (since cron runs every minute)
  const lastSent = await dbGet<{ sent_at: string }>(`
    SELECT sent_at FROM notification_logs
    WHERE status = 'sent'
    ORDER BY id DESC
    LIMIT 1
  `);

  if (lastSent && lastSent.sent_at) {
    const lastSentTime = new Date(lastSent.sent_at).getTime();
    const elapsedMs = now.getTime() - lastSentTime;
    if (elapsedMs < 60 * 1000) {
      // Already sent in this minute, skip duplicate
      return false;
    }
  }

  console.log(`[Scheduler] Triggering reminder at ${currentTimeStr} (${tz})`);

  // Auto record +1 sip (50ml) in database for this reminder!
  const nowIso = now.toISOString();
  const dateStr = nowIso.substring(0, 10);
  const logId = `reminder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sipMl = 50;

  try {
    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES (?, ?, ?, 'reminder', ?, ?)
    `, [logId, sipMl, 1.0, nowIso, dateStr]);
    console.log(`[Scheduler] Auto-recorded +1 sip (${sipMl}ml) into water_logs for ${dateStr}`);
  } catch (logErr) {
    console.error('[Scheduler] Error auto-recording sip:', logErr);
  }

  const payload = {
    title: 'WaterMate - Đến giờ uống nước! 💧',
    body: settings.notification_message || `💧 Đã tự động cộng +1 ngụm (${sipMl}ml)! Uống một ngụm nước nhé.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/?refresh=1',
  };

  const result = await sendNotificationToAll(payload);
  console.log(`[Scheduler] Reminder sent: ${result.sent} succeeded, ${result.failed} failed out of ${result.total} devices.`);
  return result.sent > 0;
}

export async function evaluateEventReminders(): Promise<void> {
  const now = new Date();
  const tz = 'Asia/Ho_Chi_Minh';

  // Format today's date in YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = dateFormatter.format(now); // "YYYY-MM-DD"

  // Format current time in HH:mm
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const currentTimeStr = timeFormatter.format(now); // "HH:mm"

  // Fetch active incomplete events that haven't been notified today
  const events = await dbQuery<{
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    remind_days: string;
    is_completed: boolean | number;
    last_notified_date: string | null;
  }>(`
    SELECT * FROM event_reminders
    WHERE (is_completed = FALSE OR is_completed = 0)
      AND (last_notified_date IS NULL OR last_notified_date != ?)
  `, [todayStr]);

  if (!events || events.length === 0) {
    return;
  }

  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const todayUtc = Date.UTC(tY, tM - 1, tD);

  for (const event of events) {
    if (!event.event_date) continue;

    const [eY, eM, eD] = event.event_date.split('-').map(Number);
    const eventUtc = Date.UTC(eY, eM - 1, eD);
    const diffDays = Math.round((eventUtc - todayUtc) / (1000 * 60 * 60 * 24));

    // If event has already passed
    if (diffDays < 0) {
      continue;
    }

    // Check target reminder time (default 09:00)
    const targetTime = event.event_time || '09:00';
    if (currentTimeStr < targetTime) {
      // Haven't reached the reminder time yet today
      continue;
    }

    // Parse configured remind days, e.g. "3,2,1,0" -> [3, 2, 1, 0]
    const remindDays = (event.remind_days || '3,2,1,0')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));

    // Check if diffDays matches configured schedule
    if (remindDays.includes(diffDays)) {
      let title = '';
      let body = '';

      if (diffDays === 0) {
        title = `🎯 Hôm nay: ${event.title}!`;
        body = event.description ? `${event.description}` : `Sự kiện diễn ra hôm nay. Đừng quên nhé!`;
      } else if (diffDays === 1) {
        title = `⏳ Ngày mai: ${event.title}!`;
        body = event.description ? `Còn 1 ngày: ${event.description}` : `Sự kiện sẽ diễn ra vào ngày mai (${event.event_date})!`;
      } else {
        title = `📅 Còn ${diffDays} ngày: ${event.title}`;
        body = event.description ? `Sắp đến: ${event.description}` : `Sự kiện diễn ra vào ${event.event_date}. Chuẩn bị nhé!`;
      }

      console.log(`[EventScheduler] Sending event reminder: "${title}" (diffDays: ${diffDays})`);

      const payload = {
        title,
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        url: '/?tab=events',
      };

      await sendNotificationToAll(payload, 'event');

      // Mark event as notified for today
      await dbRun('UPDATE event_reminders SET last_notified_date = ? WHERE id = ?', [todayStr, event.id]);
    }
  }
}
