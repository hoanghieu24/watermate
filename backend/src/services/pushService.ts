import webpush from 'web-push';
import { dbGet, dbRun, dbQuery } from '../db/database.js';
import '../config/vapid.js';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export async function saveSubscription(subscription: webpush.PushSubscription) {
  const now = new Date().toISOString();
  const endpoint = subscription.endpoint;
  const json = JSON.stringify(subscription);

  const existing = await dbGet<{ id: number }>('SELECT id FROM push_subscriptions WHERE endpoint = ?', [endpoint]);

  if (existing) {
    await dbRun(`
      UPDATE push_subscriptions
      SET subscription_json = ?, is_active = TRUE, updated_at = ?
      WHERE id = ?
    `, [json, now, existing.id]);
    return existing.id;
  } else {
    await dbRun(`
      INSERT INTO push_subscriptions (endpoint, subscription_json, is_active, created_at, updated_at)
      VALUES (?, ?, TRUE, ?, ?)
    `, [endpoint, json, now, now]);
    const inserted = await dbGet<{ id: number }>('SELECT id FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    return inserted?.id || 1;
  }
}

export async function sendNotificationToAll(payload: PushPayload, statusType: 'sent' | 'test' = 'sent'): Promise<{ sent: number; failed: number; total: number }> {
  const rows = await dbQuery<{ id: number; endpoint: string; subscription_json: string }>(
    'SELECT id, endpoint, subscription_json FROM push_subscriptions WHERE is_active = TRUE'
  );

  if (rows.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();
  const payloadString = JSON.stringify(payload);

  for (const row of rows) {
    try {
      const sub = JSON.parse(row.subscription_json) as webpush.PushSubscription;
      await webpush.sendNotification(sub, payloadString, {
        TTL: 60 * 60, // 1 hour time-to-live
        urgency: 'high',
      });
      sent++;

      // Log success
      await dbRun(`
        INSERT INTO notification_logs (scheduled_at, sent_at, status, error_message)
        VALUES (?, ?, ?, NULL)
      `, [now, now, statusType]);
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const errorMessage = (err as Error)?.message || 'Unknown push error';

      console.error(`Failed push to subscription ${row.id} (${statusCode}):`, errorMessage);

      // Log failure
      await dbRun(`
        INSERT INTO notification_logs (scheduled_at, sent_at, status, error_message)
        VALUES (?, ?, 'failed', ?)
      `, [now, now, `${statusCode || 'ERR'}: ${errorMessage}`]);

      // 404 or 410 indicates subscription has expired or unsubscribed
      if (statusCode === 404 || statusCode === 410) {
        await dbRun('UPDATE push_subscriptions SET is_active = FALSE, updated_at = ? WHERE id = ?', [now, row.id]);
        console.log(`Deactivated expired subscription ${row.id}`);
      }
    }
  }

  return { sent, failed, total: rows.length };
}
