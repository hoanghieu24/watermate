export interface User {
  id: string;
  username: string;
  created_at?: string;
}

export interface WaterLog {
  id: string | number;
  amount_ml: number;
  sip_equivalent: number;
  source: 'sip' | 'half_cup' | 'full_cup' | 'custom' | 'reminder';
  created_at: string; // ISO string
  local_date: string; // YYYY-MM-DD
  user_id?: string | null;
}

export interface ReminderSettings {
  id?: number;
  user_id?: string | null;

  // 1. Water Reminder (Tắt bật thông báo uống nước)
  enabled: boolean;
  water_enabled?: boolean;
  start_time: string; // HH:mm, e.g. "08:00"
  end_time: string;   // HH:mm, e.g. "22:00"
  interval_minutes: number; // 10, 15, 30, 45, 60, 90, 120, etc.
  timezone: string;   // e.g. "Asia/Ho_Chi_Minh"
  notification_message: string;
  paused_until?: string | null; // ISO string or null
  quiet_hours_enabled?: boolean;
  quiet_start_time?: string; // HH:mm, e.g. "12:00"
  quiet_end_time?: string;   // HH:mm, e.g. "13:30"

  // 2. Event Reminder (Tắt bật thông báo nhắc nhở lịch & tự xoá khi xong)
  event_enabled?: boolean;
  event_auto_delete?: boolean;

  // 3. Trash Reminder (Tắt bật thông báo lịch đổ rác)
  trash_enabled?: boolean;
  trash_days?: string; // e.g. "1,3,5" (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)
  trash_time?: string; // e.g. "19:00"
  trash_message?: string;
  last_trash_notified_date?: string | null;
}

export interface UserPreferences {
  daily_goal_ml: number;
  sip_ml: number; // default 50
  cup_ml: number; // default 450
  user_name: string;
}

export interface DaySummary {
  local_date: string;
  total_ml: number;
  total_sips: number;
  log_count: number;
  percentage: number;
}

export interface EventReminder {
  id: string;
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:mm, default "09:00"
  remind_days: string; // e.g. "3,2,1,0"
  is_completed: boolean;
  created_at: string;
  last_notified_date?: string | null;
  user_id?: string | null;
}
