import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbGet, dbRun, dbQuery } from '../db/database.js';
import { createAuthToken, requireAuthMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Tên tài khoản phải có ít nhất 3 ký tự' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username exists
    const existing = await dbGet<UserRow>('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing) {
      return res.status(409).json({ error: 'Tên tài khoản này đã được sử dụng' });
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const nowIso = new Date().toISOString();

    await dbRun(`
      INSERT INTO users (id, username, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, cleanUsername, passwordHash, salt, nowIso]);

    // Create default settings for user
    await dbRun(`
      INSERT INTO reminder_settings (
        enabled, water_enabled, event_enabled, event_auto_delete, trash_enabled,
        trash_days, trash_time, trash_message, user_id, start_time, end_time,
        interval_minutes, timezone, notification_message, quiet_hours_enabled,
        quiet_start_time, quiet_end_time
      )
      VALUES (
        1, 1, 1, 1, 0,
        '1,3,5', '19:00', '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
        ?, '08:00', '22:00', 60, 'Asia/Ho_Chi_Minh',
        '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.', 0, '12:00', '13:30'
      )
    `, [userId]);

    const token = createAuthToken(userId, cleanUsername);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username: cleanUsername,
        created_at: nowIso,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Lỗi đăng ký tài khoản máy chủ' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên tài khoản và mật khẩu' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = await dbGet<UserRow>('SELECT * FROM users WHERE username = ?', [cleanUsername]);

    if (!user || !verifyPassword(String(password), user.salt, user.password_hash)) {
      return res.status(401).json({ error: 'Tên tài khoản hoặc mật khẩu không chính xác' });
    }

    const token = createAuthToken(user.id, user.username);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi đăng nhập hệ thống' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await dbGet<UserRow>('SELECT id, username, created_at FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Lỗi xác thực người dùng' });
  }
});

// POST /api/auth/sync (Migrate local data to Cloud Account)
authRouter.post('/sync', requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { water_logs, event_reminders, settings } = req.body;
    let syncedLogs = 0;
    let syncedEvents = 0;

    // 1. Sync water logs
    if (Array.isArray(water_logs)) {
      for (const log of water_logs) {
        if (!log.id || !log.amount_ml) continue;
        const exists = await dbGet('SELECT id FROM water_logs WHERE id = ?', [log.id]);
        if (!exists) {
          await dbRun(`
            INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [log.id, log.amount_ml, log.sip_equivalent || 1.0, log.source || 'custom', log.created_at || new Date().toISOString(), log.local_date, userId]);
          syncedLogs++;
        } else {
          await dbRun('UPDATE water_logs SET user_id = ? WHERE id = ? AND user_id IS NULL', [userId, log.id]);
        }
      }
    }

    // 2. Sync event reminders
    if (Array.isArray(event_reminders)) {
      for (const ev of event_reminders) {
        if (!ev.id || !ev.title || !ev.event_date) continue;
        const exists = await dbGet('SELECT id FROM event_reminders WHERE id = ?', [ev.id]);
        if (!exists) {
          await dbRun(`
            INSERT INTO event_reminders (id, title, description, event_date, event_time, remind_days, is_completed, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [ev.id, ev.title, ev.description || '', ev.event_date, ev.event_time || '09:00', ev.remind_days || '3,2,1,0', ev.is_completed ? 1 : 0, ev.created_at || new Date().toISOString(), userId]);
          syncedEvents++;
        } else {
          await dbRun('UPDATE event_reminders SET user_id = ? WHERE id = ? AND user_id IS NULL', [userId, ev.id]);
        }
      }
    }

    // 3. Sync settings if provided
    if (settings && typeof settings === 'object') {
      const userSettings = await dbGet('SELECT id FROM reminder_settings WHERE user_id = ?', [userId]);
      if (userSettings) {
        await dbRun(`
          UPDATE reminder_settings
          SET enabled = COALESCE(?, enabled),
              water_enabled = COALESCE(?, water_enabled),
              event_enabled = COALESCE(?, event_enabled),
              event_auto_delete = COALESCE(?, event_auto_delete),
              trash_enabled = COALESCE(?, trash_enabled),
              trash_days = COALESCE(?, trash_days),
              trash_time = COALESCE(?, trash_time),
              trash_message = COALESCE(?, trash_message),
              start_time = COALESCE(?, start_time),
              end_time = COALESCE(?, end_time),
              interval_minutes = COALESCE(?, interval_minutes)
          WHERE user_id = ?
        `, [
          settings.enabled !== undefined ? (settings.enabled ? 1 : 0) : null,
          settings.water_enabled !== undefined ? (settings.water_enabled ? 1 : 0) : null,
          settings.event_enabled !== undefined ? (settings.event_enabled ? 1 : 0) : null,
          settings.event_auto_delete !== undefined ? (settings.event_auto_delete ? 1 : 0) : null,
          settings.trash_enabled !== undefined ? (settings.trash_enabled ? 1 : 0) : null,
          settings.trash_days,
          settings.trash_time,
          settings.trash_message,
          settings.start_time,
          settings.end_time,
          settings.interval_minutes,
          userId,
        ]);
      }
    }

    res.json({
      success: true,
      synced_logs: syncedLogs,
      synced_events: syncedEvents,
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Lỗi đồng bộ dữ liệu lên tài khoản' });
  }
});

