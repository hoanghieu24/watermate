import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const isPostgres = Boolean(process.env.DATABASE_URL);

let pgPool: pg.Pool | null = null;
let sqliteDb: DatabaseSync | null = null;

if (isPostgres) {
  console.log('Connecting to PostgreSQL (Aiven/Cloud)...');
  // Allow cloud-managed self-signed certificates (Aiven, Render, Neon)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  let connStr = process.env.DATABASE_URL || '';
  // Remove sslmode=require from URL so it doesn't override rejectUnauthorized: false
  connStr = connStr.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

  pgPool = new Pool({
    connectionString: connStr,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
  });
} else {
  console.log('Using local SQLite database...');
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'watermate.db');
  sqliteDb = new DatabaseSync(dbPath);
}

// Convert SQLite '?' placeholders to Postgres '$1, $2, ...'
function toPgSql(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    const pgSql = toPgSql(sql);
    const result = await pgPool.query(pgSql, params);
    return result.rows as T[];
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare(sql).all(...params) as unknown as T[];
    return rows;
  }
  return [];
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (isPostgres && pgPool) {
    const pgSql = toPgSql(sql);
    const result = await pgPool.query(pgSql, params);
    return (result.rows[0] as T) || null;
  } else if (sqliteDb) {
    const row = sqliteDb.prepare(sql).get(...params) as unknown as T | undefined;
    return row || null;
  }
  return null;
}

export async function dbRun(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: any }> {
  if (isPostgres && pgPool) {
    const pgSql = toPgSql(sql);
    const result = await pgPool.query(pgSql, params);
    return { changes: result.rowCount || 0 };
  } else if (sqliteDb) {
    const result = sqliteDb.prepare(sql).run(...params);
    return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
  }
  return { changes: 0 };
}

export async function initDb(): Promise<void> {
  if (isPostgres && pgPool) {
    // PostgreSQL Tables
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

      CREATE TABLE IF NOT EXISTS water_logs (
        id VARCHAR(100) PRIMARY KEY,
        amount_ml INTEGER NOT NULL,
        sip_equivalent NUMERIC(5, 1) NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        local_date VARCHAR(20) NOT NULL,
        user_id VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(local_date);
      CREATE INDEX IF NOT EXISTS idx_water_logs_user ON water_logs(user_id);

      CREATE TABLE IF NOT EXISTS reminder_settings (
        id SERIAL PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        water_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        event_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        event_auto_delete BOOLEAN NOT NULL DEFAULT TRUE,
        trash_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        trash_days VARCHAR(50) NOT NULL DEFAULT '1,3,5',
        trash_time VARCHAR(10) NOT NULL DEFAULT '19:00',
        trash_message TEXT NOT NULL DEFAULT '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
        last_trash_notified_date VARCHAR(20),
        user_id VARCHAR(100),
        start_time VARCHAR(10) NOT NULL DEFAULT '08:00',
        end_time VARCHAR(10) NOT NULL DEFAULT '22:00',
        interval_minutes INTEGER NOT NULL DEFAULT 60,
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        notification_message TEXT NOT NULL DEFAULT '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.',
        paused_until TIMESTAMPTZ,
        quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        quiet_start_time VARCHAR(10) NOT NULL DEFAULT '12:00',
        quiet_end_time VARCHAR(10) NOT NULL DEFAULT '13:30'
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        subscription_json TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        user_id VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);

      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        scheduled_at TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS event_reminders (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date VARCHAR(20) NOT NULL,
        event_time VARCHAR(10) NOT NULL DEFAULT '09:00',
        remind_days VARCHAR(50) NOT NULL DEFAULT '3,2,1,0',
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL,
        last_notified_date VARCHAR(20),
        user_id VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS idx_event_date ON event_reminders(event_date);
    `);

    // Migration columns for existing Postgres tables
    try { await pgPool.query('ALTER TABLE reminder_settings DROP CONSTRAINT IF EXISTS reminder_settings_id_check;'); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS water_enabled BOOLEAN NOT NULL DEFAULT TRUE;'); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS event_enabled BOOLEAN NOT NULL DEFAULT TRUE;'); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS event_auto_delete BOOLEAN NOT NULL DEFAULT TRUE;'); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS trash_enabled BOOLEAN NOT NULL DEFAULT FALSE;'); } catch {}
    try { await pgPool.query("ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS trash_days VARCHAR(50) NOT NULL DEFAULT '1,3,5';"); } catch {}
    try { await pgPool.query("ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS trash_time VARCHAR(10) NOT NULL DEFAULT '19:00';"); } catch {}
    try { await pgPool.query("ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS trash_message TEXT NOT NULL DEFAULT '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.';"); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS last_trash_notified_date VARCHAR(20);'); } catch {}
    try { await pgPool.query('ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);'); } catch {}

    try { await pgPool.query('ALTER TABLE water_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);'); } catch {}
    try { await pgPool.query('ALTER TABLE event_reminders ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);'); } catch {}
    try { await pgPool.query('ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);'); } catch {}

    // Ensure default settings row
    const existing = await pgPool.query('SELECT id FROM reminder_settings WHERE id = 1');
    if (existing.rowCount === 0) {
      await pgPool.query(`
        INSERT INTO reminder_settings (id, enabled, water_enabled, event_enabled, event_auto_delete, trash_enabled, trash_days, trash_time, trash_message, start_time, end_time, interval_minutes, timezone, notification_message, quiet_hours_enabled, quiet_start_time, quiet_end_time)
        VALUES (1, true, true, true, true, false, '1,3,5', '19:00', '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.', '08:00', '22:00', 60, 'Asia/Ho_Chi_Minh', '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.', false, '12:00', '13:30')
      `);
    }

    console.log('PostgreSQL database (Aiven) initialized successfully.');
  } else if (sqliteDb) {
    // SQLite Tables
    sqliteDb.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

      CREATE TABLE IF NOT EXISTS water_logs (
        id TEXT PRIMARY KEY,
        amount_ml INTEGER NOT NULL,
        sip_equivalent REAL NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        local_date TEXT NOT NULL,
        user_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(local_date);
      CREATE INDEX IF NOT EXISTS idx_water_logs_user ON water_logs(user_id);

      CREATE TABLE IF NOT EXISTS reminder_settings (
        id INTEGER PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 1,
        water_enabled INTEGER NOT NULL DEFAULT 1,
        event_enabled INTEGER NOT NULL DEFAULT 1,
        event_auto_delete INTEGER NOT NULL DEFAULT 1,
        trash_enabled INTEGER NOT NULL DEFAULT 0,
        trash_days TEXT NOT NULL DEFAULT '1,3,5',
        trash_time TEXT NOT NULL DEFAULT '19:00',
        trash_message TEXT NOT NULL DEFAULT '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
        last_trash_notified_date TEXT,
        user_id TEXT,
        start_time TEXT NOT NULL DEFAULT '08:00',
        end_time TEXT NOT NULL DEFAULT '22:00',
        interval_minutes INTEGER NOT NULL DEFAULT 60,
        timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        notification_message TEXT NOT NULL DEFAULT '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.',
        paused_until TEXT,
        quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
        quiet_start_time TEXT NOT NULL DEFAULT '12:00',
        quiet_end_time TEXT NOT NULL DEFAULT '13:30'
      );
    `);

    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN quiet_hours_enabled INTEGER NOT NULL DEFAULT 0;'); } catch {}
    try { sqliteDb.exec("ALTER TABLE reminder_settings ADD COLUMN quiet_start_time TEXT NOT NULL DEFAULT '12:00';"); } catch {}
    try { sqliteDb.exec("ALTER TABLE reminder_settings ADD COLUMN quiet_end_time TEXT NOT NULL DEFAULT '13:30';"); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN water_enabled INTEGER NOT NULL DEFAULT 1;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN event_enabled INTEGER NOT NULL DEFAULT 1;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN event_auto_delete INTEGER NOT NULL DEFAULT 1;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN trash_enabled INTEGER NOT NULL DEFAULT 0;'); } catch {}
    try { sqliteDb.exec("ALTER TABLE reminder_settings ADD COLUMN trash_days TEXT NOT NULL DEFAULT '1,3,5';"); } catch {}
    try { sqliteDb.exec("ALTER TABLE reminder_settings ADD COLUMN trash_time TEXT NOT NULL DEFAULT '19:00';"); } catch {}
    try { sqliteDb.exec("ALTER TABLE reminder_settings ADD COLUMN trash_message TEXT NOT NULL DEFAULT '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.';"); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN last_trash_notified_date TEXT;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE reminder_settings ADD COLUMN user_id TEXT;'); } catch {}

    try { sqliteDb.exec('ALTER TABLE water_logs ADD COLUMN user_id TEXT;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE event_reminders ADD COLUMN user_id TEXT;'); } catch {}
    try { sqliteDb.exec('ALTER TABLE push_subscriptions ADD COLUMN user_id TEXT;'); } catch {}

    const settingsRow = sqliteDb.prepare('SELECT id FROM reminder_settings WHERE id = 1').get();
    if (!settingsRow) {
      sqliteDb.prepare(`
        INSERT INTO reminder_settings (id, enabled, water_enabled, event_enabled, event_auto_delete, trash_enabled, trash_days, trash_time, trash_message, start_time, end_time, interval_minutes, timezone, notification_message, quiet_hours_enabled, quiet_start_time, quiet_end_time)
        VALUES (1, 1, 1, 1, 1, 0, '1,3,5', '19:00', '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.', '08:00', '22:00', 60, 'Asia/Ho_Chi_Minh', '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.', 0, '12:00', '13:30')
      `).run();
    }

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT UNIQUE NOT NULL,
        subscription_json TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        user_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);

      CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scheduled_at TEXT NOT NULL,
        sent_at TEXT,
        status TEXT NOT NULL,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS event_reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL DEFAULT '09:00',
        remind_days TEXT NOT NULL DEFAULT '3,2,1,0',
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_notified_date TEXT,
        user_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_event_date ON event_reminders(event_date);
    `);

    console.log('SQLite database initialized successfully.');
  }
}
